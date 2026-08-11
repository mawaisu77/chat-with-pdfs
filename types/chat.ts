export type ChatRole = "user" | "assistant" | "system";

export type RAGSource = {
  source: string;
  page?: number;
  section?: string;
  score: number;
  preview: string;
};

export type ChatMessageItem = {
  id: string;
  role: ChatRole;
  content: string;
  streaming?: boolean;
  sources?: RAGSource[];
};

export type RAGDocument = {
  id: string;
  source: string;
  chunks: number;
  pages: number;
  status?: "pending" | "indexing" | "ready" | "failed";
};
