function readEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

function requireEnv(key: string): string {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readIntEnv(key: string, fallback: number): number {
  const raw = readEnv(key);

  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid integer for ${key}: ${raw}`);
  }

  return parsed;
}

function readFloatEnv(key: string, fallback: number): number {
  const raw = readEnv(key);

  if (!raw) return fallback;

  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${key}: ${raw}`);
  }

  return parsed;
}

export const env = {
  openai: {
    apiKey: () => requireEnv("OPENAI_API_KEY"),
    chatModel: () => readEnv("OPENAI_CHAT_MODEL") || "gpt-4o-mini",
    embeddingModel: () => readEnv("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small",
    embeddingDimensions: () => readIntEnv("OPENAI_EMBEDDING_DIMENSIONS", 1536),
  },
  pinecone: {
    apiKey: () => requireEnv("PINECONE_API_KEY"),
    indexName: () => requireEnv("PINECONE_INDEX_NAME"),
  },
  database: {
    url: () => requireEnv("DATABASE_URL"),
  },
  storage: {
    localDir: () => readEnv("LOCAL_STORAGE_DIR") || ".uploads",
  },
  supabase: {
    url: () => readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () => readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: () => readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    storageBucket: () => readEnv("SUPABASE_STORAGE_BUCKET") || "documents",
  },
  rag: {
    chunkSize: () => readIntEnv("RAG_CHUNK_SIZE", 900),
    chunkOverlap: () => readIntEnv("RAG_CHUNK_OVERLAP", 150),
    retrievalLimit: () => readIntEnv("RAG_RETRIEVAL_LIMIT", 4),
    scoreThreshold: () => readFloatEnv("RAG_SCORE_THRESHOLD", 0.25),
    maxUploadBytes: () => readIntEnv("MAX_UPLOAD_BYTES", 10 * 1024 * 1024),
    maxFilesPerSet: () => readIntEnv("MAX_FILES_PER_SET", 20),
  },
} as const;

export function assertDatabaseConfigured() {
  env.database.url();
}

export function isSupabaseStorageConfigured() {
  return (
    readEnv("USE_SUPABASE_STORAGE") === "true" &&
    Boolean(readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"))
  );
}

/** @deprecated Use assertDatabaseConfigured */
export function assertSupabaseConfigured() {
  assertDatabaseConfigured();
}

export function assertPineconeConfigured() {
  env.pinecone.apiKey();
  env.pinecone.indexName();
}
