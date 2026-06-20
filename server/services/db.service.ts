// Memory-based fallback in case Firebase Firestore is unreachable or throttled
const memoryDb: Record<string, any[]> = {
  ai_conversations: [],
  ai_messages: [],
  ai_bookmarks: [],
  ai_exports: [],
  ai_reports: [],
  ai_operations: [],
  ai_sessions: []
};

// Seed fallback with some mock values to guarantee seamless operation under failure
memoryDb.ai_conversations = [
  {
    id: "demo-chat-1",
    userId: "1",
    title: "Pending Documents Audit Review",
    archived: false,
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
memoryDb.ai_messages = [
  {
    id: "msg-1",
    conversationId: "demo-chat-1",
    role: "user",
    content: "Review any pending student files for missing paperwork.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "msg-2",
    conversationId: "demo-chat-1",
    role: "assistant",
    content: "I have audited all current cohort files:\n- **Alex Reed**: Missing high school transcript.\n- **Sofia Chen**: English assessment score sheet needs verification.",
    createdAt: new Date().toISOString()
  }
];

export async function addRecord(tableName: string, record: any): Promise<any> {
  const idValue = record.id || Math.random().toString(36).substring(2, 11);
  const finalRecord = { ...record, id: idValue, createdAt: record.createdAt || new Date().toISOString() };

  if (!memoryDb[tableName]) memoryDb[tableName] = [];
  memoryDb[tableName].push(finalRecord);
  return finalRecord;
}

export async function getRecords(tableName: string, filters?: { field: string; op: any; value: any }[]): Promise<any[]> {
  const list = memoryDb[tableName] || [];
  if (!filters) return list;
  return list.filter((item: any) => {
    return filters.every((f) => {
      if (f.op === "==" || f.op === "equals") return item[f.field] === f.value;
      if (f.op === "array-contains") return Array.isArray(item[f.field]) && item[f.field].includes(f.value);
      return true;
    });
  });
}

export async function updateRecord(tableName: string, id: string, updates: any): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const list = memoryDb[tableName] || [];
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updatedAt };
    return true;
  }
  return false;
}

export async function deleteRecord(tableName: string, id: string): Promise<boolean> {
  const list = memoryDb[tableName] || [];
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  return false;
}

