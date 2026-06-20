export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  bookmarked: boolean;
  createdAt: string;
}

export interface AIBookmark {
  id: string;
  messageId: string;
  conversationId: string;
  content: string;
  createdAt: string;
}

export interface AIExport {
  id: string;
  exportType: "conversation" | "report";
  format: "csv" | "excel" | "pdf" | "json";
  fileName: string;
  contentLength: number;
  createdAt: string;
}

export interface AIReport {
  id: string;
  reportType: string;
  content: string;
  criteria: any;
  createdAt: string;
}
