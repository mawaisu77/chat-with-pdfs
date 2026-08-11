import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

import { assertPineconeConfigured, env } from "@/lib/env";
import { RAGError } from "@/lib/errors";

export type ChunkMetadata = {
  document_set_id: string;
  document_id: string;
  source: string;
  page: number;
  section: string;
  text: string;
};

export type SearchResult = {
  id: string;
  score: number;
  metadata: ChunkMetadata;
};

let pineconeClient: Pinecone | null = null;
let embeddingsClient: OpenAIEmbeddings | null = null;
let cachedIndexHost: string | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    assertPineconeConfigured();
    pineconeClient = new Pinecone({ apiKey: env.pinecone.apiKey() });
  }

  return pineconeClient;
}

function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddingsClient) {
    embeddingsClient = new OpenAIEmbeddings({
      apiKey: env.openai.apiKey(),
      model: env.openai.embeddingModel(),
      dimensions: env.openai.embeddingDimensions(),
    });
  }

  return embeddingsClient;
}

async function resolveIndexHost(): Promise<string> {
  const configuredHost = process.env.PINECONE_INDEX_HOST?.trim();

  if (configuredHost) {
    return configuredHost;
  }

  if (cachedIndexHost) {
    return cachedIndexHost;
  }

  const client = getPineconeClient();
  const indexName = env.pinecone.indexName();
  const description = await client.describeIndex(indexName);

  if (!description.host) {
    throw mapPineconeError(new Error(`Pinecone index "${indexName}" was not found.`));
  }

  cachedIndexHost = description.host;
  return cachedIndexHost;
}

async function getIndex() {
  const host = await resolveIndexHost();
  return getPineconeClient().index(env.pinecone.indexName(), host);
}

function isPineconeNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";

  return (
    name === "PineconeNotFoundError" ||
    message.includes("404") ||
    message.toLowerCase().includes("not found")
  );
}

function mapPineconeError(error: unknown): RAGError {
  const message = error instanceof Error ? error.message : String(error);
  const indexName = env.pinecone.indexName();

  if (message.includes("404") || message.toLowerCase().includes("not found")) {
    return new RAGError(
      `Pinecone index "${indexName}" was not found. Run "npm run pinecone:setup" or create the index in the Pinecone console.`,
      "pinecone_index_missing",
      503,
    );
  }

  return new RAGError(message, "pinecone_error", 502);
}

function toMetadata(chunk: Document, documentSetId: string, documentId: string): ChunkMetadata {
  return {
    document_set_id: documentSetId,
    document_id: documentId,
    source: String(chunk.metadata?.source || "unknown"),
    page: typeof chunk.metadata?.page === "number" ? chunk.metadata.page : 1,
    section: String(chunk.metadata?.section || "Section 1"),
    text: chunk.pageContent,
  };
}

export async function upsertChunks(
  documentSetId: string,
  documentId: string,
  chunks: Document[],
): Promise<number> {
  if (chunks.length === 0) return 0;

  const embeddings = getEmbeddings();
  const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.pageContent));
  const index = await getIndex();

  const records = chunks.map((chunk, chunkIndex) => ({
    id: `${documentId}:${chunkIndex}`,
    values: vectors[chunkIndex],
    metadata: toMetadata(chunk, documentSetId, documentId),
  }));

  const batchSize = 100;

  for (let offset = 0; offset < records.length; offset += batchSize) {
    const batch = records.slice(offset, offset + batchSize);
    try {
      await index.upsert({ records: batch });
    } catch (error) {
      throw mapPineconeError(error);
    }
  }

  return records.length;
}

export async function deleteByDocumentId(documentId: string): Promise<void> {
  const index = await getIndex();

  try {
    await index.deleteMany({
      filter: { document_id: { $eq: documentId } },
    });
  } catch (error) {
    if (isPineconeNotFoundError(error)) {
      return;
    }

    throw mapPineconeError(error);
  }
}

export async function deleteByDocumentSetId(documentSetId: string): Promise<void> {
  const index = await getIndex();

  try {
    await index.deleteMany({
      filter: { document_set_id: { $eq: documentSetId } },
    });
  } catch (error) {
    if (isPineconeNotFoundError(error)) {
      return;
    }

    throw mapPineconeError(error);
  }
}

export async function similaritySearch(
  documentSetId: string,
  query: string,
  limit = env.rag.retrievalLimit(),
): Promise<SearchResult[]> {
  const embeddings = getEmbeddings();
  const queryVector = await embeddings.embedQuery(query);
  const index = await getIndex();

  const response = await index.query({
    vector: queryVector,
    topK: limit,
    includeMetadata: true,
    filter: { document_set_id: { $eq: documentSetId } },
  });

  return (response.matches ?? [])
    .filter((match) => match.metadata)
    .map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata as unknown as ChunkMetadata,
    }));
}

export function filterByScoreThreshold(
  results: SearchResult[],
  threshold = env.rag.scoreThreshold(),
): SearchResult[] {
  return results.filter((result) => result.score >= threshold);
}

export async function assertVectorStoreConfigured(): Promise<void> {
  try {
    assertPineconeConfigured();
    env.openai.apiKey();
    await getIndex();
  } catch (error) {
    if (error instanceof Error) {
      throw new RAGError(error.message, "missing_config", 503);
    }

    throw error;
  }
}
