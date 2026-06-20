import { GoogleGenAI, GenerateContentResponse, Schema } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure Gemini Client is initialized with appropriate User-Agent headers
let aiClient: GoogleGenAI | null = null;

const getGeminiClient = () => {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API Key: GEMINI_API_KEY environment variable is not defined");
  }
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiClient;
};

const DEFAULT_MODEL = "gemini-2.5-flash";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a Gemini content generation call with exponential backup retries
 */
export async function callGeminiWithRetry(
  prompt: string,
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL,
  temperature?: number,
  maxOutputTokens?: number,
  retries: number = 4,
  delayMs: number = 2000
): Promise<GenerateContentResponse> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (temperature !== undefined) config.temperature = temperature;
      if (maxOutputTokens !== undefined) config.maxOutputTokens = maxOutputTokens;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      return response;
    } catch (error: any) {
      console.error(`Gemini call attempt ${i + 1} failed:`, error.message || error);
      lastError = error;
      const errorStr = error.message || String(error);
      
      // Switch model on 503 High Demand
      if ((errorStr.includes("503") || error.status === 503) && modelName === "gemini-2.5-flash") {
         console.warn("Switching to gemini-2.5-flash-lite due to 503 error");
         modelName = "gemini-2.5-flash-lite";
      }

      // FALLBACK
      if (errorStr.includes("429") || errorStr.includes("quota")) {
         throw new Error("AI service temporarily unavailable. Please try again later.");
      }

      if (i < retries - 1) {
        let waitTime = delayMs * Math.pow(2, i);

        const retryMatch = errorStr.match(/retry in ([\d\.]+)s/);
        if (retryMatch && retryMatch[1]) {
           waitTime = Math.ceil(parseFloat(retryMatch[1])) * 1000 + 1000;
        }
        
        if (waitTime > 15000) {
          throw new Error("AI service temporarily unavailable. Please try again later.");
        }

        await sleep(waitTime);
      }
    }
  }
  throw new Error("AI service temporarily unavailable. Please try again later.");
}

export async function callGeminiStructured(
  prompt: string,
  responseSchema: any,
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL
): Promise<any> {
  const config: any = {
    tools: [{ googleSearch: {} }],
  };
  if (systemInstruction) config.systemInstruction = systemInstruction;

  const schemaString = JSON.stringify(responseSchema, null, 2);
  const promptWithSchema = `${prompt}\n\nIMPORTANT: You must return the output EXACTLY as valid JSON that conforms to the following schema. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the raw JSON string.\n\nSCHEMA:\n${schemaString}`;

  for (let i = 0; i < 4; i++) {
    try {
      console.log("\n[Backend Log] - Gemini Request:");
      console.log("Model:", modelName);
      console.log("Prompt:", promptWithSchema);

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptWithSchema,
        config,
      });

      console.log("\n[Backend Log] - Gemini Response Received");
      if (response.text) {
        let text = response.text.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length - 3);
        text = text.trim();

        let parsed;
        try {
          parsed = JSON.parse(text);
          console.log("[Backend Log] - Schema Validation Result: SUCCESS");
          return parsed;
        } catch(e) {
          console.log("[Backend Log] - Schema Validation Result: FAILED (Parse Error)", e);
        }
      }
      return null;
    } catch (error: any) {
      console.error(`Gemini callStructured attempt ${i + 1} failed:`, error.message || error);
      
      let waitTime = 2000 * Math.pow(2, i);
      const errorStr = error.message || String(error);

      // FALLBACK
      if (errorStr.includes("429") || errorStr.includes("quota")) {
         throw new Error("AI service temporarily unavailable. Please try again later.");
      }

      const retryMatch = errorStr.match(/retry in ([\d\.]+)s/);
      if (retryMatch && retryMatch[1]) {
         waitTime = Math.ceil(parseFloat(retryMatch[1])) * 1000 + 1000; // Add 1s buffer
      }
      
      if (waitTime > 15000) {
        throw new Error("AI service temporarily unavailable. Please try again later.");
      }

      await sleep(waitTime);
    }
  }
  throw new Error("AI service temporarily unavailable. Please try again later.");
}


export async function classifyIntent(prompt: string): Promise<any> {
  const classificationSchema: Schema = {
    type: "OBJECT" as any,
    properties: {
      intent: { type: "STRING" as any, description: "One of: CREATE_COUNTRY, CREATE_UNIVERSITY, DISCOVER_UNIVERSITIES, BULK_CREATE_UNIVERSITIES, CREATE_SCHOLARSHIP, VERIFY_COUNTRY, VERIFY_ALL_COUNTRIES, VERIFY_ALL_UNIVERSITIES, VERIFY_ALL_SCHOLARSHIPS, AUDIT_PLATFORM, CHAT" },
      hasEntity: { type: "BOOLEAN" as any, description: "True if target entity name is provided or if it's a bulk/all operation" },
      entityName: { type: "STRING" as any, description: "The name of the entity, or 'all'" },
      missingEntityReply: { type: "STRING" as any, description: "If hasEntity is false or intent is CHAT, provide a polite response" }
    },
    required: ["intent", "hasEntity"]
  };

  const classificationPrompt = `Analyze the admin prompt: "${prompt}".
Determine the intent.
If they want to create/add a single country, intent=CREATE_COUNTRY. If a single university, CREATE_UNIVERSITY.
If they want to create/discover university cards IN a country/region generally (e.g. "Create university cards in Australia"), intent=DISCOVER_UNIVERSITIES and set entityName to the country.
If they respond to discovery with a count (e.g. "Top 10", "All", "Top 5"), intent=BULK_CREATE_UNIVERSITIES.
If they want to verify/update a specific country, intent=VERIFY_COUNTRY.
If they want to verify ALL countries, intent=VERIFY_ALL_COUNTRIES.
If they want to generate an executive report, analyze trends, summarize an entity, detect duplicates, or ask a general analytical question, intent=CHAT and set hasEntity=false.
If it lacks a explicitly named entity for creation (e.g. "Add country card"), set hasEntity=false and provide a 'missingEntityReply' like "Which country would you like me to create?".`;

  return await callGeminiStructured(classificationPrompt, classificationSchema, "You are an admin intent classifier.");
}

export async function buildChatResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  contextData: any,
  settings?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<string> {
  const targetModel = settings?.model || DEFAULT_MODEL;
  
  // Format overall system instruction mapping context information
  const statsSummary = contextData.stats || {};
  const contextSummaryString = `
--- CONTEXT DATA ---
Active Students Count: ${statsSummary.activeStudents || 0}
Pending Applications Count: ${contextData.applications?.filter((a: any) => a.status === "pending" || a.status?.toLowerCase() === "pending").length || 0}
Missing Documents Count: ${contextData.documents?.filter((d: any) => d.status === "rejected" || d.status === "missing" || d.status?.toLowerCase() === "rejected").length || 0}
Total Universities Saved: ${contextData.universities?.length || 0}
Total Scholarships Saved: ${contextData.scholarships?.length || 0}

Verify specific requirements:
- Applications: Ensure pending items are routed to admission teams.
- Documents: Rejected files must show exact error reasons (e.g. blurred scan).
- Universities: deadlines and tuition rankings comparison.
- Scholarships: eligibility, deadlines.
`;

  const systemInstruction = `You are GlobalGrad AI Copilot, a premium, production-grade enterprise operations workspace assistant.
You assist operations team in managing student applications, audit documents risk, recommend scholarships, and compile country demand insights.
Be incredibly thorough, accurate, logical, and structured. 

RULES:
1. Provide concise executive summaries.
2. Use statistics from Firebase.
3. Present insights in dashboard style.
4. Highlight warnings and opportunities.
5. Never generate placeholder or fake metrics.
6. DO NOT output ANY markdown syntax. DO NOT use asterisks (* or **), hashes (#), dashes for lists (-), backticks (\`), or HTML tags.
7. Use ALL CAPS for section headings.
8. Use unicode bullets (•) for list items.

${contextSummaryString}
User currently interacting: ${contextData.userName || "Advisor"}.
Ensure replies do not mention database internals or JSON contexts directly. Keep answers polished and highly informative.`;

  // Combine message history into structured contents string for content generation
  let conversationText = "";
  for (const m of messages) {
    const roleLabel = m.role === "user" ? "User" : "Assistant";
    conversationText += `${roleLabel}: ${m.content}\n\n`;
  }
  conversationText += "Assistant:";

  try {
    const res = await callGeminiWithRetry(
      conversationText,
      systemInstruction,
      targetModel,
      settings?.temperature,
      settings?.maxTokens
    );
    return res.text || "No response text generated.";
  } catch (err: any) {
    console.error("Gemini buildChatResponse failed:", err);
    throw err;
  }
}
