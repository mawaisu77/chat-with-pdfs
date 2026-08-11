export type DocumentSetRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  document_set_id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  page_count: number | null;
  chunk_count: number;
  status: "pending" | "indexing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
};

export type IngestionJobRow = {
  id: string;
  document_id: string;
  stage: "upload" | "parse" | "chunk" | "embed" | "done" | "failed";
  progress: number;
  updated_at: string;
};

export type ChatRow = {
  id: string;
  user_id: string;
  document_set_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: unknown | null;
  created_at: string;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      document_sets: TableDef<
        DocumentSetRow,
        {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<DocumentSetRow>
      >;
      documents: TableDef<
        DocumentRow,
        {
          id?: string;
          document_set_id: string;
          filename: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          page_count?: number | null;
          chunk_count?: number;
          status?: DocumentRow["status"];
          error_message?: string | null;
          created_at?: string;
        },
        Partial<DocumentRow>
      >;
      ingestion_jobs: TableDef<
        IngestionJobRow,
        {
          id?: string;
          document_id: string;
          stage?: IngestionJobRow["stage"];
          progress?: number;
          updated_at?: string;
        },
        Partial<IngestionJobRow>
      >;
      chats: TableDef<
        ChatRow,
        {
          id?: string;
          user_id: string;
          document_set_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<ChatRow>
      >;
      messages: TableDef<
        MessageRow,
        {
          id?: string;
          chat_id: string;
          role: MessageRow["role"];
          content: string;
          sources?: unknown | null;
          created_at?: string;
        },
        Partial<MessageRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
