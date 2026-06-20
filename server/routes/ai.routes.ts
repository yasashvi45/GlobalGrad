import { Router } from "express";
import {
  handleAIChat,
  getConversationHistory,
  getConversationMessages,
  getOperations,
  deleteConversation,
  archiveConversation,
  renameConversation,
  exportAICopilotData,
  generateAnalyticalReport,
  generateStudentSummary,
  generateUniversityComparison,
  matchScholarships,
  generateOperationsAction,
  approveOperationsAction
} from "../controllers/ai.controller";

const router = Router();

// Define API routing bindings
router.post("/chat", handleAIChat);
router.post("/operations/generate", generateOperationsAction);
router.post("/operations/approve", approveOperationsAction);
router.get("/history", getConversationHistory);
router.post("/history", getConversationHistory); // support POST as well if client invokes it
router.get("/conversation/messages", getConversationMessages);
router.get("/operations", getOperations);
router.post("/conversation/delete", deleteConversation);
router.post("/conversation/archive", archiveConversation);
router.post("/conversation/rename", renameConversation);
router.post("/export", exportAICopilotData);
router.post("/report", generateAnalyticalReport);
router.post("/student-summary", generateStudentSummary);
router.post("/university-compare", generateUniversityComparison);
router.post("/scholarship-match", matchScholarships);

export default router;
