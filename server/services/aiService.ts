import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

export class AIService {
  private static instance: AIService;
  private ai: GoogleGenAI;

  private constructor() {
    this.verifyApiKey();
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
      httpOptions: {
        headers: {
          'User-Agent': 'globalgrad-ai-backend',
        }
      }
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private verifyApiKey() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API Key: GEMINI_API_KEY environment variable is not defined");
    }
  }

  public async generateStudentResponse(query: string, userData: any, platformData: any): Promise<string> {
    console.log("[AI_SERVICE] AI REQUEST STARTED");
    
    // Trim payload
    if (platformData) {
      if (Array.isArray(platformData.universities)) platformData.universities = platformData.universities.slice(0, 50);
      if (Array.isArray(platformData.countries)) platformData.countries = platformData.countries.slice(0, 50);
      if (Array.isArray(platformData.scholarships)) platformData.scholarships = platformData.scholarships.slice(0, 50);
    }

    const isJsonRequest = query.toLowerCase().includes("json array") || query.toLowerCase().includes("output only the json");

    const systemInstruction = `You are GlobalGrad AI, an expert international education counselor, university advisor, scholarship consultant, visa strategist, and application mentor.

Your purpose is to help students successfully study abroad by providing highly personalized, accurate, actionable, and encouraging guidance.

${isJsonRequest ? '' : `====================================================
FORMATTING RULES (CRITICAL)
====================================================
1. DO NOT output ANY markdown syntax. DO NOT use asterisks (* or **), hashes (#), dashes for lists (-), backticks (\`), or HTML tags.
2. Use ALL CAPS for section headings (e.g. BEST MATCHES, NEXT STEPS).
3. Use short sections and never dump large walls of text.
4. Use unicode bullets (•) for list items.
5. Use emojis only when helpful.
6. Remove undefined values and duplicate information. Keep responses concise and professional.
7. Responses must feel like a premium study-abroad consultant, not a generic chatbot.

====================================================
RESPONSE STRUCTURE & RECOMMENDATIONS
====================================================
When providing recommendations (Maximum 3-5 at a time), YOU MUST include for each:
• Name
• Country
• Why it matches
• Estimated cost
• Match score
• Next action

Always structure your responses exactly like this:

BEST MATCHES
[University recommendations with required fields]

WHY RECOMMENDED
[Personalized explanation based on student's profile]

ESTIMATED BUDGET
[Cost breakdown]

NEXT STEPS
[Actionable checklist]
`}
====================================================
DATA USAGE
====================================================
Before answering, analyze this context:
--- USER DATA ---
${JSON.stringify(userData || {}, null, 2).substring(0, 10000)}
-----------------
--- PLATFORM DATA (Universities, Countries, Scholarships) ---
${JSON.stringify(platformData || {}, null, 2).substring(0, 30000)}
-----------------
Use actual user data. Priority goes to information from the student's profile. Never generate fake profiles or placeholder metrics.

====================================================
ADMIN AI MODE
====================================================
If current user role = admin: Act as platform intelligence assistant.
Provide concise executive summaries. Use statistics from Firebase data. Present insights in dashboard style. Highlight warnings and opportunities. Never generate placeholder or fake metrics.

====================================================
TONE
====================================================
Professional, Helpful, Positive, Action-Oriented.`;

    let response;
    try {
      console.log("[AI_SERVICE] Gemini initialized, request sent to standard model...");
      response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query || "Hi",
        config: { systemInstruction },
      });
    } catch (e: any) {
      if (e.status === 503 || (e.message && e.message.includes("503"))) {
        console.log("[AI_SERVICE] Model overloaded (503), retrying with lite model...");
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: query || "Hi",
          config: { systemInstruction },
        });
      } else {
        throw e;
      }
    }

    console.log("[AI_SERVICE] Gemini response received");
    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return response.text;
  }
}

export const aiService = AIService.getInstance();
