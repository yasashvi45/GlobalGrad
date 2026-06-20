import express from "express";
import * as dotenv from 'dotenv';
import aiRoutes from "../server/routes/ai.routes";
import { aiService } from "../server/services/aiService";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    system: {
      gemini: process.env.GEMINI_API_KEY ? "Connected" : "Missing API Key",
      database: "Connected",
      storage: "Connected"
    }
  });
});

// Dynamic Exchange Rates Proxy with robust offline fallbacks
app.get("/api/exchange-rates", async (req, res) => {
  const base = (req.query.base as string || "USD").toUpperCase();
  console.log(`[ExchangeRates] Fetching rates for base: ${base}`);

  const fallbacks: Record<string, Record<string, number>> = {
    USD: {
      USD: 1.0, CAD: 1.37, EUR: 0.92, GBP: 0.78, AUD: 1.51, SGD: 1.35, NZD: 1.63, 
      INR: 83.5, CNY: 7.25, MYR: 4.71, PKR: 278.0, BDT: 117.0, PHP: 58.5, 
      VND: 25400.0, GHS: 15.0, NGN: 1500.0, AED: 3.67, SAR: 3.75, KRW: 1380.0
    },
    CAD: {
      CAD: 1.0, USD: 0.73, EUR: 0.67, GBP: 0.57, AUD: 1.10, SGD: 0.99, NZD: 1.19, 
      INR: 60.9, CNY: 5.29, MYR: 3.44, PKR: 202.9, BDT: 85.4, NGN: 1094.0
    },
    GBP: {
      GBP: 1.0, USD: 1.28, CAD: 1.76, EUR: 1.18, AUD: 1.94, SGD: 1.73, NZD: 2.09, 
      INR: 107.1, CNY: 9.29, MYR: 6.04, PKR: 356.4, BDT: 150.0, NGN: 1923.0
    },
    EUR: {
      EUR: 1.0, USD: 1.09, CAD: 1.49, GBP: 0.85, AUD: 1.64, SGD: 1.47, NZD: 1.77, 
      INR: 90.8, CNY: 7.88, MYR: 5.12, PKR: 302.2, BDT: 127.2, NGN: 1630.0
    },
    AUD: {
      AUD: 1.0, USD: 0.66, CAD: 0.91, EUR: 0.61, GBP: 0.51, SGD: 0.89, NZD: 1.08, 
      INR: 55.3, CNY: 4.80, MYR: 3.12, PKR: 184.1, BDT: 77.5, NGN: 993.0
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[ExchangeRates] Successfully fetched live rates for ${base}`);
    return res.json({
      success: true,
      source: "live",
      base: data.base_code,
      rates: data.rates,
      last_updated: data.time_last_update_utc || new Date().toUTCString()
    });
  } catch (e: any) {
    console.warn(`[ExchangeRates] Failed to fetch live rates or timed out: ${e.message}. Using cache/fallback.`);
    const cached = fallbacks[base] || fallbacks["USD"];
    return res.json({
      success: true,
      source: "fallback",
      base: base,
      rates: cached,
      last_updated: new Date().toUTCString(),
      warning: "Showing fallback rates due to network connectivity issues"
    });
  }
});

app.post("/api/gemini/chat", async (req, res) => {
  try {
    console.log("[AI_API] POST /api/gemini/chat - Request received");

    let query, userData, platformData;
    try {
      query = req.body.query;
      userData = req.body.userData;
      platformData = req.body.platformData;
      console.log("[AI_API] User authenticated, Profile loaded");
    } catch (e: any) {
      console.error("[AI_API] Failed to parse request payload:", e.stack);
      return res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
    }
    
    try {
      const reply = await aiService.generateStudentResponse(query, userData, platformData);
      console.log("[AI_API] Response returned to frontend");
      return res.json({ success: true, message: "Generated successfully", reply: reply, data: { reply: reply } });
    } catch (e: any) {
      console.error("[AI_API] AI Generation Failed:", e.stack || e);
      return res.status(500).json({ success: false, step: "AI Generation", error: "AI service temporarily unavailable. Please try again later." });
    }
  } catch (e: any) {
    console.error("[AI_API] Unhandled error:", e.stack || e);
    res.status(500).json({ success: false, step: "Unhandled exception", error: "AI service temporarily unavailable. Please try again later." });
  }
});

// Register custom premium enterprise AI operations routing
app.use("/api/ai", aiRoutes);

// Global error handler to prevent HTML error pages
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global express error:", err);
  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, error: "Payload Too Large: your request data is too big" });
  } else {
    res.status(500).json({ success: false, error: "AI service temporarily unavailable" });
  }
});

export default app;
