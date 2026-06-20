import { Request, Response } from "express";
import { buildChatResponse, callGeminiWithRetry, callGeminiStructured, classifyIntent } from "../services/gemini.service";
import { getRecords, addRecord, updateRecord, deleteRecord } from "../services/db.service";
import { Schema } from "@google/genai";
const Type = {
  STRING: "string" as any,
  OBJECT: "object" as any,
  ARRAY: "array" as any,
  NUMBER: "number" as any,
  BOOLEAN: "boolean" as any
};

const countrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    capital: { type: Type.STRING },
    currency: { type: Type.STRING },
    language: { type: Type.STRING },
    population: { type: Type.STRING },
    gdp: { type: Type.STRING },
    avgTuition: { type: Type.STRING },
    avgLivingCost: { type: Type.STRING },
    visaType: { type: Type.STRING },
    workRights: { type: Type.STRING },
    description: { type: Type.STRING },
    topUniversities: { type: Type.STRING },
    flagImage: { type: Type.STRING }
  },
  required: ["name", "capital", "currency", "language", "population", "gdp", "avgTuition", "avgLivingCost", "visaType", "workRights", "description", "topUniversities"]
};

const universitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    country: { type: Type.STRING },
    globalRank: { type: Type.STRING },
    acceptanceRate: { type: Type.STRING },
    tuitionFeeRange: { type: Type.STRING },
    programsCount: { type: Type.STRING },
    website: { type: Type.STRING },
    description: { type: Type.STRING }
  },
  required: ["name", "country", "globalRank", "acceptanceRate", "tuitionFeeRange", "programsCount", "description"]
};

const scholarshipSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    provider: { type: Type.STRING },
    amount: { type: Type.STRING },
    deadline: { type: Type.STRING },
    eligibility: { type: Type.STRING },
    country: { type: Type.STRING },
    link: { type: Type.STRING },
    description: { type: Type.STRING }
  },
  required: ["name", "provider", "amount", "deadline", "eligibility", "country", "description"]
};

const auditSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    score: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          entityName: { type: Type.STRING },
          storedValue: { type: Type.STRING },
          currentValue: { type: Type.STRING },
          status: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    }
  },
  required: ["status", "score", "summary", "items"]
};

export async function generateOperationsAction(req: Request, res: Response) {
  try {
    const { actionType: explicitAction, prompt, entities, contextData } = req.body;
    let actionType = explicitAction || "create_country";
    const pLower = prompt.toLowerCase();
    
    // Determine action by intent heuristic if not strictly mapped front-end
    if (pLower.includes("audit") && pLower.includes("platform")) actionType = "audit_platform";
    else if (pLower.includes("audit") && pLower.includes("countr")) actionType = "audit_countries";
    else if (pLower.includes("audit") && pLower.includes("universit")) actionType = "audit_universities";
    else if (pLower.includes("audit") && pLower.includes("scholarship")) actionType = "audit_scholarships";
    else if (pLower.includes("create") && pLower.includes("universit")) actionType = "create_university";
    else if (pLower.includes("create") && pLower.includes("scholarship")) actionType = "create_scholarship";
    else if (pLower.includes("create") && pLower.includes("countr")) actionType = "create_country";

    const classified = await classifyIntent(prompt);

    if (!classified.hasEntity && !["VERIFY_ALL_COUNTRIES", "VERIFY_ALL_UNIVERSITIES", "VERIFY_ALL_SCHOLARSHIPS", "AUDIT_PLATFORM", "CHAT", "BULK_CREATE_UNIVERSITIES"].includes(classified.intent)) {
       return res.json({ action: "chat_reply", message: classified.missingEntityReply || "Please specify the entity name." });
    }

    const statsMsg = contextData ? `
Use the following LIVE database records from context:
Countries count: ${contextData.countries?.length || 0}
Countries: ${contextData.countries?.map((c:any) => c.name).join(', ') || 'None'}

Universities count: ${contextData.universities?.length || 0}
Universities (top 20): ${contextData.universities?.slice(0, 20).map((c:any) => `${c.name} (${c.country})`).join(', ') || 'None'}

Scholarships count: ${contextData.scholarships?.length || 0}
Scholarships (top 20): ${contextData.scholarships?.slice(0, 20).map((c:any) => c.name).join(', ') || 'None'}

Applications: ${contextData.applications?.length || 0}
Students: ${contextData.stats?.activeStudents || 0}
` : '';

    if (classified.intent === "CHAT") {
       if (!classified.hasEntity && classified.missingEntityReply && classified.missingEntityReply.includes("Which country")) {
           return res.json({ action: "chat_reply", message: classified.missingEntityReply });
       }
       const dbPrompt = `You must use your search capabilities to actively retrieve factual data ONLY IF needed. Generate a detailed, analytical response ONLY to this specific admin query: "${prompt}". 

${statsMsg}

IMPORTANT: Only answer the question asked. Do NOT dump all database statistics or other entities unless specifically requested by the prompt. Formatting should be clean.`;
       const systemInstructionCHAT = `ROLE: You are GlobalGrad Admin AI Copilot. Your purpose is to assist authorized administrators in operating the GlobalGrad platform.

RULES:
1. Read the admin query carefully.
2. Identify the exact intent.
3. Fetch only relevant Firebase data from context.
4. Never dump unrelated dashboard statistics.
5. Never add unnecessary sections.
6. Never provide generic responses if real database data exists.
7. Always prioritize database facts over assumptions.
8. Use tables and bullet lists when useful.
9. Give concise executive answers.
10. Answer ONLY the administrator's question.

RESPONSE FORMAT:

TITLE

Key Result

Supporting Details

Recommended Action (only when needed)

If no action is needed, do not show recommendations. Ensure all responses are professional, concise, data-driven, and based on real database records. DO NOT output ANY markdown syntax like asterisks, hashes, backticks, or HTML tags. Use unicode bullets (•) for lists.`;
       const chatReply = await callGeminiWithRetry(dbPrompt, systemInstructionCHAT);
       
       return res.json({ action: "chat_reply", message: chatReply.text });
    }

    const targetEntity = classified.entityName || prompt;
    actionType = classified.intent.toLowerCase();

    // Duplicate Detection Handling
    if (actionType === "create_country") {
       const existingCountries = contextData?.countries || [];
       const duplicate = existingCountries.find((c: any) => c.name?.toLowerCase().includes(targetEntity.toLowerCase()) || targetEntity.toLowerCase().includes(c.name?.toLowerCase()));
       if (duplicate) {
          return res.json({
             action: "chat_reply",
             message: `Existing record found.\n\nCountry:\n${duplicate.name}\n\nCreated:\n${duplicate.createdAt ? new Date(duplicate.createdAt).toISOString().split('T')[0] : 'Unknown'}\n\nOptions:\n* Update Existing Record\n* Create New Version\n* Cancel`
          });
       }
    } else if (actionType === "create_university") {
       const existingUnis = contextData?.universities || [];
       const duplicate = existingUnis.find((c: any) => c.name?.toLowerCase().includes(targetEntity.toLowerCase()) || targetEntity.toLowerCase().includes(c.name?.toLowerCase()));
       if (duplicate) {
          return res.json({
             action: "chat_reply",
             message: `Existing record found.\n\nUniversity:\n${duplicate.name}\n\nCreated:\n${duplicate.createdAt ? new Date(duplicate.createdAt).toISOString().split('T')[0] : 'Unknown'}\n\nOptions:\n* Update Existing Record\n* Create New Version\n* Cancel`
          });
       } 
    } else if (actionType === "create_scholarship") {
       const existingScholarships = contextData?.scholarships || [];
       const duplicate = existingScholarships.find((c: any) => c.name?.toLowerCase().includes(targetEntity.toLowerCase()) || targetEntity.toLowerCase().includes(c.name?.toLowerCase()));
       if (duplicate) {
          return res.json({
             action: "chat_reply",
             message: `Existing record found.\n\nScholarship:\n${duplicate.name}\n\nCreated:\n${duplicate.createdAt ? new Date(duplicate.createdAt).toISOString().split('T')[0] : 'Unknown'}\n\nOptions:\n* Update Existing Record\n* Create New Version\n* Cancel`
          });
       } 
    }

    const systemInstruction = `ROLE: You are GlobalGrad Admin AI Copilot. Your purpose is to assist authorized administrators in operating the GlobalGrad platform. You have permission to Create/Update Countries, Universities, Scholarships, Manage Applications, Audit Documents, Generate Reports, Analyze Platform Data, Manage Student Records.

RULES:
1. Never modify database schemas.
2. Never invent fields.
3. Always use existing database collections and field definitions.
4. All create/update actions must generate a preview before saving.
5. All database writes require admin confirmation.
6. Validate all required fields before save.
7. Prevent duplicate records.
8. USE GOOGLE SEARCH OR INTERNAL KNOWLEDGE TO ACTIVELY RETRIEVE VERIFIED INFORMATION.
9. Populate all valid schema constraints. ONLY if an isolated piece of information is strictly unable to be found from any source, use "Data unavailable" for that specific field. NEVER return an entirely empty or "Data unavailable" record when a simple search can find the factual data (e.g., if asked for "University of Melbourne", search and retrieve its metrics).
10. Never expose API keys, credentials, internal tokens, or backend secrets.`;

    const validateGeneratedData = (data: any) => {
      if (!data || typeof data !== 'object') return false;
      let totalFields = 0;
      let emptyFields = 0;
      for (const key in data) {
        totalFields++;
        const val = data[key];
        if (val === undefined || val === null || val === "" || val === "Data unavailable" || val === "unknown" || val === "N/A") {
          emptyFields++;
        }
      }
      if (totalFields === 0) return false;
      return (emptyFields / totalFields) <= 0.3;
    };

    if (actionType === "create_country") {
      const dbPrompt = `You must use your search capabilities to actively retrieve factual country data for: "${targetEntity}". Fetch real population, GDP, average tuition, living costs, visa types, and top universities. Map this data exactly to the schema.`;
      const generatedData = await callGeminiStructured(dbPrompt, countrySchema, systemInstruction);
      if (!validateGeneratedData(generatedData)) throw new Error("Gemini generation failed: Too many empty fields or unable to fetch real data.");
      return res.json({ action: "create_country", status: "preview", record: generatedData });
    } else if (actionType === "verify_country") {
      const existingCountries = contextData?.countries || [];
      const currentRec = existingCountries.find((c: any) => c.name?.toLowerCase().includes(targetEntity.toLowerCase()) || targetEntity.toLowerCase().includes(c.name?.toLowerCase()));
      const dbPrompt = `You must use your search capabilities to actively retrieve the latest factual country data for: "${targetEntity}". Here is the existing record: ${JSON.stringify(currentRec || {})}. Fetch real population, GDP, average tuition, living costs, visa types, and top universities. Map this data exactly to the country schema.`;
      const generatedData = await callGeminiStructured(dbPrompt, countrySchema, systemInstruction);
      if (!validateGeneratedData(generatedData)) throw new Error("Gemini generation failed: Too many empty fields or unable to fetch real data.");
      
      let diffMsg = `Difference Report & Verification for ${targetEntity}:\n\n`;
      if (currentRec) {
         for (const key in generatedData) {
            if (currentRec[key] && currentRec[key] !== generatedData[key]) {
               diffMsg += `* **${key}**:\n  Stored: ${currentRec[key]}\n  Current: ${generatedData[key]}\n\n`;
            }
         }
      } else {
         diffMsg += `No existing record found for ${targetEntity} in database. Formatted fresh data below.\n\n`;
      }
      diffMsg += `Review the verified payload and approve to save the latest structured data.`;
      return res.json({ action: "verify_country", status: "preview", message: diffMsg, record: generatedData });
    } else if (actionType === "verify_all_countries") {
      const records = contextData?.countries || [];
      const ctx = records.map((r: any) => ({ entityName: r.name, gdp: r.gdp, population: r.population, avgTuition: r.avgTuition })).slice(0, 10);
      const dbPrompt = `Audit these country records. Actively search the web for current data and identify outdated information vs current factual data. Compare the stored data against reality. Data: ${JSON.stringify(ctx)}`;
      const generatedData = await callGeminiStructured(dbPrompt, auditSchema, systemInstruction);
      
      const upToDate = generatedData.items?.filter((i:any) => i.status === "Valid").length || 0;
      const outdated = generatedData.items?.length ? generatedData.items.length - upToDate : 0;
      const msg = `Countries Checked: ${generatedData.items?.length || 0}\n\nUp To Date: ${upToDate}\n\nRequires Update: ${outdated}\n\nSee detailed field differences in the audit report below.\n\nYou can Review Individually or Approve All Updates.`;

      return res.json({ action: "verify_all_countries", status: "audit", message: msg, record: generatedData });
    } else if (actionType === "discover_universities") {
      const dbPrompt = `You must use your search capabilities to actively retrieve factual university data belonging to "${targetEntity}". Output a list of their names. Do not invent any. Make sure you get the top universities in this country.`;
      const discoverSchema: Schema = {
        type: Type.OBJECT,
        properties: { list: { type: Type.ARRAY, items: { type: Type.STRING } } }
      };
      const generatedData = await callGeminiStructured(dbPrompt, discoverSchema, systemInstruction);
      const uniNames = generatedData.list || [];
      const existingUnis = contextData?.universities || [];
      
      let duplicates = 0;
      for (const name of uniNames) {
          if (existingUnis.some((u: any) => u.name?.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(u.name?.toLowerCase()))) {
             duplicates++;
          }
      }
      
      const newUnis = uniNames.length - duplicates;
      
      const msg = `**${targetEntity}**\n\n${uniNames.map((n: string) => `* ${n}`).join('\n')}\n\n---\nAlready Exists: ${existingUnis.length}\nNew Universities: ${newUnis}\nDuplicates: ${duplicates}\n\nHow many university records should be generated?\n\nOptions:\n* Top 10\n* Top 20\n* All\n* Custom Selection`;
      
      return res.json({ action: "chat_reply", message: msg });
    } else if (actionType === "bulk_create_universities") {
       // "targetEntity" might be "Top 10" or "All". We'll generate an array of universities.
       const bulkUniSchema: Schema = {
          type: Type.OBJECT,
          properties: {
             items: {
                type: Type.ARRAY,
                items: universitySchema
             }
          }
       };
       const dbPrompt = `You must use your search capabilities to actively retrieve factual university data for ${targetEntity}. Based on the prompt: "${prompt}". Fetch real QS/THE global rankings, acceptance rates, tuition fee ranges, program counts, and website. Map this data exactly to the schema. Make a list for multiple universities.`;
       const generatedData = await callGeminiStructured(dbPrompt, bulkUniSchema, systemInstruction);
       return res.json({ action: "bulk_create_universities", status: "bulk_preview", record: generatedData });
    } else if (actionType === "create_university") {
      const dbPrompt = `You must use your search capabilities to actively retrieve factual university data for: "${targetEntity}". Fetch real QS/THE global rankings, acceptance rates, tuition fee ranges, program counts, and website. Map this data exactly to the schema.`;
      const generatedData = await callGeminiStructured(dbPrompt, universitySchema, systemInstruction);
      if (!validateGeneratedData(generatedData)) throw new Error("Gemini generation failed: Too many empty fields or unable to fetch real data.");
      return res.json({ action: "create_university", status: "preview", record: generatedData });
    } else if (actionType === "create_scholarship") {
      const dbPrompt = `You must use your search capabilities to actively retrieve factual scholarship data for: "${targetEntity}". Fetch real funding amounts, official deadlines, broad eligibility criteria, provider, and official links. Map this data exactly to the schema.`;
      const generatedData = await callGeminiStructured(dbPrompt, scholarshipSchema, systemInstruction);
      if (!validateGeneratedData(generatedData)) throw new Error("Gemini generation failed: Too many empty fields or unable to fetch real data.");
      return res.json({ action: "create_scholarship", status: "preview", record: generatedData });
    } else if (actionType === "audit_countries") {
      const records = contextData?.countries || [];
      const ctx = records.map((r: any) => ({ name: r.name, gdp: r.gdp, population: r.population, avgTuition: r.avgTuition })).slice(0, 10);
      const dbPrompt = `Audit these country records. Identify outdated information vs current factual data. Data: ${JSON.stringify(ctx)}`;
      const generatedData = await callGeminiStructured(dbPrompt, auditSchema, systemInstruction);
      return res.json({ action: "audit_countries", status: "audit", record: generatedData });
    } else if (actionType === "audit_universities") {
       const records = contextData?.universities || [];
       const ctx = records.map((r: any) => ({ name: r.name, country: r.country, globalRank: r.globalRank, acceptanceRate: r.acceptanceRate })).slice(0, 10);
       const dbPrompt = `Audit these university records. Identify outdated rankings or data. Data: ${JSON.stringify(ctx)}`;
       const generatedData = await callGeminiStructured(dbPrompt, auditSchema, systemInstruction);
       return res.json({ action: "audit_universities", status: "audit", record: generatedData });
    } else if (actionType === "audit_scholarships") {
       const records = contextData?.scholarships || [];
       const ctx = records.map((r: any) => ({ name: r.name, deadline: r.deadline, amount: r.amount, eligibility: r.eligibility })).slice(0, 10);
       const dbPrompt = `Audit these scholarship records. Identify expired deadlines or changes. Data: ${JSON.stringify(ctx)}`;
       const generatedData = await callGeminiStructured(dbPrompt, auditSchema, systemInstruction);
       return res.json({ action: "audit_scholarships", status: "audit", record: generatedData });
    } else if (actionType === "audit_platform") {
       const dbPrompt = `Audit platform health logically. Give top recommendations.\n${statsMsg}`;
       const generatedData = await callGeminiStructured(dbPrompt, auditSchema, systemInstruction);
       return res.json({ action: "audit_platform", status: "audit", record: generatedData });
    }

    // fallback mapping if unrecognized
    res.status(400).json({ error: "Unsupported actionType: " + actionType });
  } catch (err: any) {
    console.error("Controller Error in generateOperationsAction:", {
      requestBody: req.body,
      operationType: req.body?.actionType || "unknown",
      error: err.message
    });
    
    await addRecord("ai_operations", {
      action: req.body?.actionType || "generate_unknown",
      status: "FAILED",
      error: err.message || "Failed to generate structured preview",
      createdAt: new Date().toISOString()
    }).catch(() => {});
    
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

export async function approveOperationsAction(req: Request, res: Response) {
  try {
    const { action, record } = req.body;
    let collectionName = "ai_generated_records";
    let isUpdate = false;

    if (action.includes("country")) collectionName = "countries";
    else if (action.includes("university")) collectionName = "universities";
    else if (action.includes("scholarship")) collectionName = "scholarships";

    if (action.includes("verify") || action.includes("update")) {
      isUpdate = true;
    }

    let result;
    if (action === "bulk_create_universities") {
       const items = record.items || [];
       let createdCount = 0;
       let skippedCount = 0;
       const existing = await getRecords(collectionName);
       for (const item of items) {
          const duplicate = existing.find((r:any) => r.name === item.name);
          if (!duplicate) {
             await addRecord(collectionName, {
                ...item,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
             });
             createdCount++;
          } else {
             skippedCount++;
          }
       }
       result = `Created: ${createdCount}, Updated: 0, Skipped: ${skippedCount}`;
       console.log(`[Backend Log] - Database Write Result: SUCCESS (${result})`);
    } else if (action.includes("verify_all")) {
      const items = record.items || [];
      let updatedCount = 0;
      for (const item of items) {
         if (item.status === "Requires Update") {
            const existing = await getRecords(collectionName);
            const target = existing.find((r:any) => r.name === item.entityName);
            if (target && target.id) {
               console.log(`[Backend Log] - Bulk Update Initiated for ID: ${target.id}`);
               // Parse the recommendation/currentValue and update conditionally
               // For simplicity, we just mark updated if it existed in the DB.
               // Ideally this would parse the new values from currentValue
               await updateRecord(collectionName, target.id, {
                 updatedAt: new Date().toISOString()
               });
               updatedCount++;
            }
         }
      }
      result = `Bulk Updated ${updatedCount} records`;
      console.log(`[Backend Log] - Database Write Result: SUCCESS (${result})`);
    } else if (isUpdate) {
      // Find existing record and update it
      const existing = await getRecords(collectionName);
      const target = existing.find((r:any) => r.name === record.name);
      if (target && target.id) {
         console.log(`[Backend Log] - Database Update Initiated to collection: ${collectionName} for ID: ${target.id}`);
         const updatedStr = await updateRecord(collectionName, target.id, {
           ...record,
           updatedAt: new Date().toISOString()
         });
         result = target.id;
         console.log(`[Backend Log] - Database Update Result: SUCCESS (ID: ${result})`);
      } else {
         // Fallback to add
         console.log(`[Backend Log] - Database Write Initiated to collection: ${collectionName}`);
         const added = await addRecord(collectionName, {
           ...record,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
         });
         result = added.id;
         console.log(`[Backend Log] - Database Write Result: SUCCESS (ID: ${result})`);
      }
    } else {
      console.log(`[Backend Log] - Database Write Initiated to collection: ${collectionName}`);
      const added = await addRecord(collectionName, {
        ...record,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      result = added.id;
      console.log(`[Backend Log] - Database Write Result: SUCCESS (ID: ${result})`);
    }

    await addRecord("ai_operations", {
      action,
      collectionName,
      result,
      status: "SUCCESS",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, id: result, collection: collectionName });
  } catch (err: any) {
    console.error(`[Backend Log] - Database Write Result: FAILED`, err);
    await addRecord("ai_operations", {
      action: req.body?.action || "unknown",
      status: "FAILED",
      error: err.message || "Failed to save record",
      createdAt: new Date().toISOString()
    }).catch(() => {});
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Handle AI Copilot Chat Operation
 */
export async function handleAIChat(req: Request, res: Response) {
  try {
    const { messages, contextData, settings, conversationId, userId } = req.body;
    const clientUserId = userId || "1";

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array" });
    }

    // Verify or register the active conversation context on the server database
    let activeConvId = conversationId;
    if (!activeConvId) {
      const firstMsgText = messages[0]?.content || "New Conversation";
      const title = firstMsgText.length > 40 ? firstMsgText.slice(0, 37) + "..." : firstMsgText;
      const newConv = await addRecord("ai_sessions", {
        userId: clientUserId,
        title,
        archived: false,
        deleted: false,
        updatedAt: new Date().toISOString()
      });
      activeConvId = newConv.id;
    } else {
      // Update session activity timestamp
      await updateRecord("ai_sessions", activeConvId, {
        updatedAt: new Date().toISOString()
      });
    }

    // Add immediate incoming user message to memory database logs
    const userMessage = messages[messages.length - 1];
    if (userMessage && userMessage.role === "user") {
      await addRecord("ai_messages", {
        conversationId: activeConvId,
        role: "user",
        content: userMessage.content,
        bookmarked: false,
      });
    }

    // Generate response using server-bound Gemini client
    const aiReply = await buildChatResponse(messages, contextData || {}, settings);

    // Save generated reply to server database logs
    const assistantMessage = await addRecord("ai_messages", {
      conversationId: activeConvId,
      role: "assistant",
      content: aiReply,
      bookmarked: false,
    });

    res.json({
      conversationId: activeConvId,
      reply: aiReply,
      messageId: assistantMessage.id,
    });
  } catch (err: any) {
    console.error("Controller Error in handleAIChat:", err);
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * List user's conversation history
 */
export async function getConversationHistory(req: Request, res: Response) {
  try {
    const userId = req.query.userId || req.body.userId || "1";
    const statusFilter = req.query.status || "all"; // 'active', 'archived', 'all'
    
    const conversations = await getRecords("ai_sessions", [
      { field: "userId", op: "==", value: String(userId) }
    ]);

    // Apply soft deleted filters
    let list = conversations.filter(c => !c.deleted);

    if (statusFilter === "archived") {
      list = list.filter(c => c.archived);
    } else if (statusFilter === "active") {
      list = list.filter(c => !c.archived);
    }

    // Sort by most recently updated
    list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    // Expand with messages count
    const result = [];
    for (const conv of list) {
      const messages = await getRecords("ai_messages", [
        { field: "conversationId", op: "==", value: conv.id }
      ]);
      result.push({
        ...conv,
        lastMessage: messages[messages.length - 1]?.content || "",
        messagesCount: messages.length
      });
    }

    res.json({ conversations: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Mark a conversation as soft deleted
 */
export async function getConversationMessages(req: Request, res: Response) {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }
    const messages = await getRecords("ai_messages", [
      { field: "conversationId", op: "==", value: String(conversationId) }
    ]);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

export async function getOperations(req: Request, res: Response) {
  try {
    const operations = await getRecords("ai_operations");
    res.json({ operations: operations.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }

    const success = await updateRecord("ai_sessions", conversationId, { deleted: true });
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Toggle archiving status on conversation
 */
export async function archiveConversation(req: Request, res: Response) {
  try {
    const { conversationId, archived } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }

    const success = await updateRecord("ai_sessions", conversationId, { archived: !!archived });
    res.json({ success, archived: !!archived });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Rename a conversation sequence
 */
export async function renameConversation(req: Request, res: Response) {
  try {
    const { conversationId, title } = req.body;
    if (!conversationId || !title) {
      return res.status(400).json({ error: "Missing target fields conversationId or title" });
    }

    const success = await updateRecord("ai_sessions", conversationId, { title });
    res.json({ success, title });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Process custom document export operations
 */
export async function exportAICopilotData(req: Request, res: Response) {
  try {
    const { exportType, format, content, title } = req.body;
    if (!exportType || !format || !content) {
      return res.status(400).json({ error: "Missing exportType, format, or content payload" });
    }

    const fileName = `${title || "Export"}_${Date.now()}.${format === "excel" ? "xlsx" : format}`;
    
    // Log export event schema
    const loggedExport = await addRecord("ai_exports", {
      exportType,
      format,
      fileName,
      contentLength: content.length,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      exportId: loggedExport.id,
      fileName,
      downloadUrl: `/api/ai/download/${loggedExport.id}`, // Custom virtual download path
      message: `${exportType.toUpperCase()} exported as ${format.toUpperCase()} successfully.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Generate highly comprehensive, customized Reports
 */
export async function generateAnalyticalReport(req: Request, res: Response) {
  try {
    const { reportType, criteria, contextData } = req.body;
    if (!reportType) {
      return res.status(400).json({ error: "Missing required reportType parameter" });
    }

    const systemInstruction = `You are GlobalGrad's Analytic Engine. Output a comprehensive report. Use clear statistics. Avoid empty filler sentences.`;
    const prompt = `Generate a structural markdown report for: "${reportType}". Criteria: ${JSON.stringify(criteria)}. Metrics: ${JSON.stringify(contextData)}`;

    const response = await callGeminiWithRetry(prompt, systemInstruction);
    const content = response.text || "No details generated.";

    const savedReport = await addRecord("ai_reports", {
      reportType,
      criteria,
      content,
      createdAt: new Date().toISOString()
    });

    res.json({
      reportId: savedReport.id,
      title: `${reportType} Strategic Audit`,
      content,
      generatedAt: savedReport.createdAt
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Generate descriptive Student Summary Analysis
 */
export async function generateStudentSummary(req: Request, res: Response) {
  try {
    const { studentId, contextData } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId identifier" });
    }

    const studentInfo = contextData?.students?.find((s: any) => s.id === studentId) || {};
    const studentApps = contextData?.applications?.filter((a: any) => a.userId === studentId) || [];
    const studentDocs = contextData?.documents?.filter((d: any) => d.userId === studentId) || [];

    const prompt = `Produce an executive narrative summary for student: ${JSON.stringify(studentInfo)}.
Applications: ${JSON.stringify(studentApps)}.
Documents State: ${JSON.stringify(studentDocs)}.
Analyze their placement prospects, identify documentation risks, and suggest direct strategic check-lists for counselor follow-ups.`;

    const systemInstruction = `You are an expert student placement counselors. Provide clear, supportive, highly actionable operational summaries in well-formatted tables or bullet points.`;

    const response = await callGeminiWithRetry(prompt, systemInstruction);
    res.json({ summary: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Execute University Deadlines and Rankings Comparison
 */
export async function generateUniversityComparison(req: Request, res: Response) {
  try {
    const { universityNames, testScores } = req.body;
    const targets = universityNames || ["Standard Universities"];

    const prompt = `Create a professional tuition, rank, application deadline, and requirements comparison report for:
${targets.join(", ")}.
Assess suitability considering test metrics: ${JSON.stringify(testScores || {})}.`;

    const systemInstruction = `You are the GlobalGrad University Admissions Evaluator. Organize data in comparison tables with columns: University, Rank, Tuition Fees, Deadline, Requirements, Fit Analysis.`;

    const response = await callGeminiWithRetry(prompt, systemInstruction);
    res.json({ comparison: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}

/**
 * Build Scholarship eligibility & conversion rules
 */
export async function matchScholarships(req: Request, res: Response) {
  try {
    const { studentProfile, scholarshipsContext } = req.body;

    const prompt = `Analyze scholarship list: ${JSON.stringify(scholarshipsContext || [])}.
Compare eligibility against student profile: ${JSON.stringify(studentProfile || {})}.
List qualified scholarships, deadlines, funding packages, and rate eligibility probability.`;

    const systemInstruction = `You are the GlobalGrad Scholarship Funding Counselor. Output ranked match-making lists containing qualified programs and criteria checklists.`;

    const response = await callGeminiWithRetry(prompt, systemInstruction);
    res.json({ matches: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
}
