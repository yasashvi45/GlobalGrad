import { getTable } from './api';
import { getUniversities } from '../services/universityService';
import { getCountries } from '../services/countryService';
import { getScholarships } from '../services/scholarshipService';
import { getUsers } from '../services/userService';
import { auth } from './firebase';

// AI Logic Engine for Offline Smart Counselor

// Health Score
export async function getApplicationHealth() {
  try {
    const profiles = await getTable('profiles');
    const profile = profiles.length > 0 ? profiles[0] : { profileComplete: false };
    const applications = await getTable('applications').catch(() => []);
    const tasks = await getTable('tasks').catch(() => []);
    const documents = await getTable('documents').catch(() => []);

    let score = 0;
    
    // Profile Completion (Max 20)
    if (profile && profile.profileComplete !== false) score += 20;

    // Applications (Max 30)
    if (applications.length > 0) score += 10;
    if (applications.length >= 3) score += 20;

    // Tasks (Max 25)
    const completedTasks = tasks.filter((t: any) => t.completed).length;
    if (tasks.length > 0) {
      score += Math.floor((completedTasks / tasks.length) * 25);
    } else {
      score += 10; // Base score if no tasks
    }

    // Documents (Max 25)
    const verifiedDocs = documents.filter((d: any) => d.status === 'Verified').length;
    if (documents.length >= 3) score += 25;
    else if (documents.length > 0) score += 15;

    return Math.min(100, score);
  } catch (error) {
    console.error("Error calculating health score:", error);
    return 0;
  }
}

// Generate Insights
export async function generateInsights() {
  try {
    const applications = await getTable('applications').catch(() => []);
    const tasks = await getTable('tasks').catch(() => []);
    const savedUnis = await getTable('universities_saved').catch(() => []);
    const documents = await getTable('documents').catch(() => []);
    const scholarships = await getTable('scholarships_saved').catch(() => []);

    const insights = [];

    if (savedUnis.length > 0 && applications.length === 0) {
      insights.push(`You have saved ${savedUnis.length} universities but haven't applied to any. Start an application!`);
    }

    const upcomingTasks = tasks.filter((t: any) => !t.completed);
    if (upcomingTasks.length > 0) {
      insights.push(`You have ${upcomingTasks.length} pending tasks for your applications.`);
    }

    if (scholarships.length > 0) {
      insights.push(`You are tracking ${scholarships.length} scholarships. Make sure to check their deadlines!`);
    } else {
       insights.push(`You aren't tracking any scholarships. Visit the scholarships page to find funding.`);
    }

    if (documents.length < 3) {
      insights.push(`You might be missing some core documents (like SOP or Resume). Upload them to improve application readiness.`);
    }

    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

// Generate Recommendations
export async function getRecommendations() {
    try {
      const unis = await getUniversities().catch(() => []);
      const userId = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      
      const tables = ['profiles', 'study_preferences', 'applications', 'test_scores'];
      const userData:any = {};
      for (const t of tables) {
        let data = await getTable(t).catch((e) => {
           if ((t === 'profiles' || t === 'academic_profiles') && e && e.message && e.message.toLowerCase().includes('permission')) {
              window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Unable to access profile information right now.', type: 'error' } }));
           }
           return [];
        });
        userData[t] = data.filter((item:any) => String(item.userId) === String(userId));
      }
      if (!userData['profiles'] || userData['profiles'].length === 0) {
        userData['profiles'] = [{ profileComplete: false }];
      }

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: "Return a JSON array of the top 3 recommended university names from the platformData that best match my profile. The array must contain EXACT existing university names and nothing else. Example: ['Stanford University', 'MIT', 'Harvard University']. Output ONLY the JSON array.", 
          userData, 
          platformData: { universities: unis }
        })
      });
      const data = await res.json();
      
      if (res.status === 429 || res.status === 503 || res.status === 500 || data.error) {
        return [];
      }

      let text = data.reply || "";
      if (text.startsWith("```json")) text = text.substring(7);
      if (text.startsWith("```")) text = text.substring(3);
      if (text.endsWith("```")) text = text.substring(0, text.length - 3);
      text = text.trim();

      const recommendedNames = JSON.parse(text);
      if (Array.isArray(recommendedNames)) {
         return unis.filter((u: any) => recommendedNames.includes(u.name)).slice(0, 3);
      }
      return [];
    } catch(e) {
      return [];
    }
}

// Basic Chat Logic Handler
export async function handleUserQuery(query: string) {
  try {
    const userId = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    
    // Fetch context from Firebase
    const tables = ['profiles', 'study_preferences', 'applications', 'test_scores', 'academic_profiles', 'universities_saved', 'scholarships_saved', 'documents'];
    const userData:any = {};
    for (const t of tables) {
      let data = await getTable(t).catch(() => []);
      userData[t] = data.filter((item:any) => String(item.userId) === String(userId));
    }
    if (!userData['profiles'] || userData['profiles'].length === 0) {
      userData['profiles'] = [{ profileComplete: false }];
    }

    const platformData: any = {};
    platformData.countries = await getCountries().catch(() => []);
    platformData.universities = await getUniversities().catch(() => []);
    platformData.scholarships = await getScholarships().catch(() => []);

    const name = auth.currentUser?.displayName || userData['profiles'][0]?.fullName || userData['profiles'][0]?.name || 'Student';

    const systemPrompt = `
      You are a premium, highly experienced Study-Abroad AI Counselor. 
      You are speaking directly to ${name}.
      
      You must answer the exact question asked in a concise, highly structured, and professional manner.
      
      CRITICAL INSTRUCTIONS:
      - Understand user intent fully.
      - Use their actual profile data (academic details, saved preferences, target intake, saved countries, budget range, etc.) in your responses.
      - If the user simply says "Hi", "Hello", etc., greet them by name, mention their profile completion status, and proactively suggest next steps (e.g., uploading missing documents, filling out academic details). Example: "Hello ${name}. I noticed your current profile strength is... Completing your academic details and uploading required documents will significantly improve your admission readiness. How would you like to continue today?"
      - If they ask for recommendations ("best country for MS", "find universities"), analyze their CGPA, test scores, budget, and target intake against actual platformData. Do NOT give generic answers.
      - Act as a smart advisor. 
      
      FORMAT STRICTLY AS SECURE JSON. Do NOT use markdown code blocks (\`\`\`), do NOT include \`###\` or \`**\` in your text, and ensure the JSON is perfectly valid.
      
      Keep descriptions within 300-500 words maximum. Return ONLY the JSON object.
      
      {
         "summary": "Concise, tailored summary and conversational response.",
         "recommendations": [
            { "title": "Best Match / Recommendation Name", "score": 95, "description": "Short explanation of why it fits.", "cost": "$...", "details": "Extra useful context." }
         ],
         "estimatedCosts": [
            { "item": "Cost item name (e.g. Tuition, Living)", "amount": "$..." }
         ],
         "actionItems": [
            { "task": "Specific actionable next step." }
         ],
         "nextStep": "A single strong call to action or overarching next step."
      }
      If a section is not applicable, leave its array empty.
    `;

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: systemPrompt + "\\n\\nUser Query: " + query, userData, platformData })
    });
    const data = await res.json();
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      return JSON.stringify({ summary: "AI service temporarily unavailable due to high demand. Please wait a minute and try again.", recommendations: [], estimatedCosts: [], actionItems: [], nextStep: "" });
    }
    if (data.error) {
      return JSON.stringify({ summary: "AI service temporarily unavailable due to high demand. Please wait a minute and try again.", recommendations: [], estimatedCosts: [], actionItems: [], nextStep: "" });
    }
    
    let text = data.reply || "{}";
    if (text.startsWith("```json")) text = text.substring(7);
    if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);
    text = text.trim();
    
    return text;
  } catch (error) {
    console.error("AI Error:", error);
    return JSON.stringify({ summary: "AI service temporarily unavailable. Please try again later.", recommendations: [], estimatedCosts: [], actionItems: [], nextStep: "" });
  }
}

export async function generateAdminSuggestion(messageText: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         query: `A user has sent the following support message: "${messageText}". Generate a short, helpful suggestion or draft response for the support agent to send back to the user. Do not include quotes or filler, just the suggested response.`, 
         userData: {}, 
         platformData: {}, 
         assistantType: 'support' 
       })
    });
    const data = await res.json();
    if (res.status === 429 || res.status === 503 || res.status === 500 || data.error) {
       return "Could you please provide more details so I can look into this for you? (AI Quota Exceeded)";
    }
    return data.reply || "Could you please provide more details so I can look into this for you?";
  } catch (error) {
    return "Could you please provide more details so I can look into this for you?";
  }
}
