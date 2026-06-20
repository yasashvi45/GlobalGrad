import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini client on the server side
// The GEMINI_API_KEY is retrieved from environment variables.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Configure the model as requested by the user
const DEFAULT_MODEL = "gemini-2.5-flash";

// Helper function to sleep (for exponential backoff retries)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a Gemini prompt with built-in retries and error handling
 */
async function callGeminiWithRetry(
  prompt: string,
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL,
  retries: number = 3,
  delayMs: number = 1000
): Promise<GenerateContentResponse> {
  let lastError: any = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return response;
    } catch (error: any) {
      console.error(`Gemini Attempt ${i + 1} failed:`, error.message || error);
      lastError = error;
      if (i < retries - 1) {
        // Exponential backoff
        await sleep(delayMs * Math.pow(2, i));
      }
    }
  }
  throw lastError || new Error("Failed to contact Gemini after multiple attempts");
}

/**
 * Generate chat response incorporating system guidelines and global database context
 */
export async function getChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  contextData: {
    userName?: string;
    applications?: any[];
    documents?: any[];
    universities?: any[];
    scholarships?: any[];
    stats?: any;
    currentAssistantType?: string;
  }
): Promise<string> {
  // Format overall context for the LLM
  const contextSummary = {
    applicationsCount: contextData.applications?.length || 0,
    documentsCount: contextData.documents?.length || 0,
    universitiesCount: contextData.universities?.length || 0,
    scholarshipsCount: contextData.scholarships?.length || 0,
    stats: contextData.stats || {},
    recentApplications: contextData.applications?.slice(0, 5).map(a => ({
      id: a.id,
      studentName: a.userName || a.studentName || 'Unknown',
      program: a.program,
      university: a.university,
      status: a.status
    })),
    recentDocuments: contextData.documents?.slice(0, 5).map(d => ({
      id: d.id,
      studentName: d.userName || 'Unknown',
      title: d.title || d.name,
      type: d.type,
      status: d.status || 'pending'
    }))
  };

  const assistantType = contextData.currentAssistantType || 'general';

  // Customized prompt blueprints based on requested real AI features
  const systemInstructionMap: Record<string, string> = {
    general: `You are GlobalGrad AI Copilot, a premium, production-grade enterprise operations assistant.
You specialize in international student counseling, document verification, application tracking, and scholarship intelligence.
Always base your advice on the current status of platform data provided in the context below. Do not output raw JSON.
Be concise, accurate, direct, and professional. Avoid fluffy filler words. Use markdown list formats and bold highlights where appropriate.`,
    
    applications: `You are the Applications Assistant for GlobalGrad AI Copilot.
Your main job is analyzing and managing study abroad applications. Use the context to:
- Pinpoint pending applications, potential roadblocks, or missing steps.
- Suggest direct follow-up actions and write formal reminders or admission request drafts.
Your tone should be operational, action-oriented, and structured.`,

    documents: `You are the Documents Assistant for GlobalGrad AI Copilot.
Your main job is audit and verification risks for student files. Use the context to:
- Identify missing mandatory items (like transcript, visa, IELTS/TOEFL scores).
- Analyze failure reasons (e.g., poor legibility, incomplete seal).
Provide direct bulleted summaries of student document deficiencies with student names, itemized documents, and next steps.`,

    universities_scholarships: `You are the University & Scholarship Intelligence Assistant for GlobalGrad AI Copilot.
Your job is analyzing matching rules, cohort alignments, and identifying eligible scholarship profiles.
- Highlight high-value awards, eligibility requirements, and conversion rates.
- Suggest best-fit university and program matches for students based on test scores and preference trends in the data.`,

    student_operations: `You are the Student Operations Assistant for GlobalGrad.
Focus on student cohort health, counselors' engagement, and student risk factor trends.
- Offer strategic checklists for counselors to help high-risk students (with incomplete profile pages or lower performance metrics).
- Provide structural guidance on operations and administrative workflows.`,

    analytics: `You are the Analytics Assistant for GlobalGrad.
Analyze student demographics, country interest trends, program selection patterns, and conversion funnel stats.
- Interpret geographical interest.
- Provide insights about application success ratios, or reasons for denials.
Format your reports into clear, scannable data summaries with bullet lists and percentages.`
  };

  const selectedInstruction = systemInstructionMap[assistantType] || systemInstructionMap.general;

  const fullInstruction = `${selectedInstruction}

--- GLOBAL PLATFORM DATA CONTEXT ---
${JSON.stringify(contextSummary, null, 2)}
------------------------------------

User Name current chatting with you: ${contextData.userName || "Admin"}.
Strict Guidelines:
1. Speak as a direct assistant in the workspace.
2. Address the user's specific request using the PLATFORM DATA provided.
3. If they ask to draft an email or list students, output a high-quality ready-to-use template or table.
4. Keep paragraphs short (under 3 paragraphs total for chat messages unless drafting complex data reports).`;

  // Format conversations for the Google GenAI SDK.
  // Note: we can map the conversation history to the appropriate prompt query.
  // The system instruction config handles background context, while we string together the chat history.
  // To keep it robust, we pass the query or convert the full conversation into contents.
  let promptText = "";
  for (const msg of messages) {
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
    promptText += `${roleLabel}: ${msg.content}\n\n`;
  }
  promptText += "Assistant:";

  try {
    const geminiRes = await callGeminiWithRetry(promptText, fullInstruction);
    return geminiRes.text || "I was unable to formulate a response at this time.";
  } catch (err: any) {
    console.error("Gemini service failed:", err);
    return `An error occurred while communicating with the AI Copilot: ${err.message || err}. Please verify your API key is correctly configured.`;
  }
}

/**
 * Generate a comprehensive on-demand PDF/HTML/CSV report draft using Gemini
 */
export async function getGeneratedReport(
  reportType: string,
  criteria: any,
  contextData: any
): Promise<{ title: string; content: string; generatedAt: string }> {
  const prompt = `Generate a highly professional executive report for target topic: "${reportType}".
Criteria/Filters selected: ${JSON.stringify(criteria)}
Platform context metrics: ${JSON.stringify(contextData)}

Write a structured markdown report that includes:
1. Executive Summary
2. Core Analysis (include detailed metrics, data tables structured in markdown table, or percentages)
3. Actionable Operational Recommendations & Next Steps

Ensure the report is complete, analytical, and highly structured. Avoid any conversational filler before or after the report content.`;

  const systemInstruction = `You are the Lead Enterprise Analytics Engine of GlobalGrad Copilot.
You specialize in university administration, cohort statistics, enrollment forecasting, and risk analysis.
Always render comprehensive, polished, executive reports in markdown format.`;

  try {
    const res = await callGeminiWithRetry(prompt, systemInstruction, DEFAULT_MODEL, 3, 1000);
    return {
      title: `${reportType} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      content: res.text || "# Report Empty",
      generatedAt: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      title: `${reportType} (Failed)`,
      content: `### Report Generation Failure\n\nUnable to generate report: ${err.message || err}`,
      generatedAt: new Date().toISOString()
    };
  }
}
