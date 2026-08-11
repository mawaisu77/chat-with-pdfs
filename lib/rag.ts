import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { query } from "@/lib/db";
import { env, isSupabaseStorageConfigured } from "@/lib/env";
import type { ParsedDocument } from "@/lib/fileParser";
import { RAGError } from "@/lib/errors";
import { chat, chatStream, type ChatMessage } from "@/lib/llm";
import { deleteLocalFile, uploadLocalFile } from "@/lib/storage/local";
import type { DocumentRow } from "@/lib/supabase/types";
import {
  deleteByDocumentId,
  filterByScoreThreshold,
  similaritySearch,
  upsertChunks,
} from "@/lib/vectorstore";

export { RAGError };

export type RAGCitation = {
  source: string;
  page?: number;
  section?: string;
  score: number;
  preview: string;
};

export type RAGDocument = {
  id: string;
  source: string;
  chunks: number;
  pages: number;
  status: DocumentRow["status"];
};

const NOT_FOUND_ANSWER = "I couldn't find that in your documents.";

async function splitDocumentPages(document: ParsedDocument) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: env.rag.chunkSize(),
    chunkOverlap: env.rag.chunkOverlap(),
  });

  const chunks: Document[] = [];

  for (const page of document.pages) {
    const pageDocument = new Document({
      pageContent: page.text,
      metadata: {
        source: document.source,
        page: page.page,
      },
    });

    const pageChunks = await splitter.splitDocuments([pageDocument]);

    pageChunks.forEach((chunk, index) => {
      chunk.metadata.section = `Section ${index + 1}`;
      chunks.push(chunk);
    });
  }

  return chunks;
}

async function updateIngestionJob(
  jobId: string,
  stage: "upload" | "parse" | "chunk" | "embed" | "done" | "failed",
  progress: number,
) {
  await query(
    `UPDATE ingestion_jobs SET stage = $1, progress = $2, updated_at = NOW() WHERE id = $3`,
    [stage, progress, jobId],
  );
}

async function uploadFile(storagePath: string, buffer: Buffer, mimeType?: string) {
  if (isSupabaseStorageConfigured()) {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(env.supabase.storageBucket())
      .upload(storagePath, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new RAGError(error.message, "storage_error", 500);
    }

    return;
  }

  await uploadLocalFile(storagePath, buffer);
}

async function deleteStoredFile(storagePath: string) {
  if (isSupabaseStorageConfigured()) {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(env.supabase.storageBucket())
      .remove([storagePath]);

    if (error) {
      throw new RAGError(error.message, "storage_error", 500);
    }

    return;
  }

  await deleteLocalFile(storagePath);
}

export async function getRAGStatus(documentSetId: string) {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM documents
     WHERE document_set_id = $1 AND status = 'ready'`,
    [documentSetId],
  );

  const documentCount = Number.parseInt(result.rows[0]?.count ?? "0", 10);

  return {
    ready: documentCount > 0,
    documentSetId,
    documentCount,
  };
}

export async function listDocuments(documentSetId: string): Promise<RAGDocument[]> {
  const result = await query<Pick<DocumentRow, "id" | "filename" | "chunk_count" | "page_count" | "status">>(
    `SELECT id, filename, chunk_count, page_count, status FROM documents
     WHERE document_set_id = $1
     ORDER BY created_at DESC`,
    [documentSetId],
  );

  return result.rows.map((doc: Pick<DocumentRow, "id" | "filename" | "chunk_count" | "page_count" | "status">) => ({
    id: doc.id,
    source: doc.filename,
    chunks: doc.chunk_count,
    pages: doc.page_count ?? 1,
    status: doc.status,
  }));
}

export async function deleteDocument(
  documentSetId: string,
  documentId: string,
): Promise<{ id: string; source: string }> {
  const result = await query<DocumentRow>(
    `SELECT * FROM documents
     WHERE id = $1 AND document_set_id = $2
     LIMIT 1`,
    [documentId, documentSetId],
  );

  const document = result.rows[0];

  if (!document) {
    throw new RAGError("Document not found.", "not_found", 404);
  }

  await deleteByDocumentId(documentId);
  await deleteStoredFile(document.storage_path);

  await query(`DELETE FROM documents WHERE id = $1`, [documentId]);
  await query(`UPDATE document_sets SET updated_at = NOW() WHERE id = $1`, [documentSetId]);

  return { id: document.id, source: document.filename };
}

export async function ingestDocument(
  documentSetId: string,
  document: ParsedDocument,
  fileBuffer?: Buffer,
  mimeType?: string,
) {
  if (document.pages.every((page) => !page.text.trim())) {
    throw new RAGError(
      "Document is empty or text could not be extracted.",
      "empty_document",
      400,
    );
  }

  const pageCount = document.pages.length;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM documents WHERE document_set_id = $1`,
    [documentSetId],
  );

  const existingCount = Number.parseInt(countResult.rows[0]?.count ?? "0", 10);

  if (existingCount >= env.rag.maxFilesPerSet()) {
    throw new RAGError(
      `This document set already has the maximum of ${env.rag.maxFilesPerSet()} files.`,
      "limit_exceeded",
      400,
    );
  }

  const documentId = crypto.randomUUID();
  const storagePath = `${documentSetId}/${documentId}/${document.source}`;

  const insertResult = await query<DocumentRow>(
    `INSERT INTO documents (
      id, document_set_id, filename, storage_path, mime_type, size_bytes, page_count, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    RETURNING *`,
    [
      documentId,
      documentSetId,
      document.source,
      storagePath,
      mimeType ?? null,
      fileBuffer?.byteLength ?? null,
      pageCount,
    ],
  );

  const row = insertResult.rows[0];

  if (!row) {
    throw new RAGError("Failed to create document record.", "database_error", 500);
  }

  const jobResult = await query<{ id: string }>(
    `INSERT INTO ingestion_jobs (document_id, stage, progress)
     VALUES ($1, 'upload', 10)
     RETURNING id`,
    [documentId],
  );

  const jobId = jobResult.rows[0]?.id;

  if (!jobId) {
    throw new RAGError("Failed to create ingestion job.", "database_error", 500);
  }

  try {
    if (fileBuffer) {
      await uploadFile(storagePath, fileBuffer, mimeType);
    }

    await updateIngestionJob(jobId, "parse", 30);
    await query(`UPDATE documents SET status = 'indexing' WHERE id = $1`, [documentId]);

    const chunks = await splitDocumentPages(document);
    await updateIngestionJob(jobId, "chunk", 55);

    const chunkCount = await upsertChunks(documentSetId, documentId, chunks);
    await updateIngestionJob(jobId, "embed", 85);

    await query(
      `UPDATE documents
       SET status = 'ready', chunk_count = $1, page_count = $2, error_message = NULL
       WHERE id = $3`,
      [chunkCount, pageCount, documentId],
    );

    await updateIngestionJob(jobId, "done", 100);
    await query(`UPDATE document_sets SET updated_at = NOW() WHERE id = $1`, [documentSetId]);

    return {
      id: documentId,
      source: document.source,
      chunks: chunkCount,
      pages: pageCount,
      message: "Document indexed successfully",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed.";

    await query(
      `UPDATE documents SET status = 'failed', error_message = $1 WHERE id = $2`,
      [message, documentId],
    );

    await updateIngestionJob(jobId, "failed", 100);

    if (error instanceof RAGError) throw error;
    throw new RAGError(message, "ingest_failed", 500);
  }
}

function buildContextBlock(results: { metadata: { source: string; page: number; section: string; text: string }; score: number }[]) {
  return results
    .map((result, index) => {
      const { metadata, score } = result;

      return `
SOURCE ${index + 1}
File: ${metadata.source}
Location: Page ${metadata.page}, ${metadata.section}
Score: ${score}
Content:
${metadata.text}
`;
    })
    .join("\n\n");
}

function buildRAGMessages(question: string, context: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are a RAG assistant.

Rules:
1. Answer only from the provided context.
2. If the answer is not present in the context, say: "${NOT_FOUND_ANSWER}"
3. Keep the answer clear and practical.
4. Answer in the same language as the user's question.`,
    },
    {
      role: "user",
      content: `Question:
${question}

Context:
${context}`,
    },
  ];
}

function toCitations(results: Awaited<ReturnType<typeof similaritySearch>>): RAGCitation[] {
  return results.map((result) => ({
    source: result.metadata.source,
    page: result.metadata.page,
    section: result.metadata.section,
    score: result.score,
    preview: result.metadata.text.slice(0, 300),
  }));
}

export async function retrieveCitations(
  documentSetId: string,
  question: string,
  limit = env.rag.retrievalLimit(),
) {
  if (!question.trim()) {
    throw new RAGError("Question is required.", "missing_question", 400);
  }

  const rawResults = await similaritySearch(documentSetId, question, limit);
  let results = filterByScoreThreshold(rawResults);

  // Cosine scores for text-embedding-3-small are often 0.2–0.4 even for relevant
  // chunks. If the threshold filtered everything out, keep the top matches anyway.
  if (results.length === 0 && rawResults.length > 0) {
    results = rawResults.slice(0, limit);
  }

  if (results.length === 0) {
    return {
      citations: [] as RAGCitation[],
      context: "",
      messages: buildRAGMessages(question, ""),
      notFound: true,
    };
  }

  const citations = toCitations(results);
  const context = buildContextBlock(results);

  return {
    citations,
    context,
    messages: buildRAGMessages(question, context),
    notFound: false,
  };
}

export async function queryRAG(documentSetId: string, question: string) {
  const { citations, messages, notFound } = await retrieveCitations(documentSetId, question);

  if (notFound) {
    return { answer: NOT_FOUND_ANSWER, sources: citations };
  }

  const answer = await chat(messages);
  return { answer, sources: citations };
}

export async function* queryRAGStream(documentSetId: string, question: string) {
  const { citations, messages, notFound } = await retrieveCitations(documentSetId, question);

  yield { type: "sources" as const, sources: citations };

  if (notFound) {
    yield { type: "token" as const, content: NOT_FOUND_ANSWER };
    return;
  }

  for await (const token of chatStream(messages)) {
    yield { type: "token" as const, content: token };
  }
}
