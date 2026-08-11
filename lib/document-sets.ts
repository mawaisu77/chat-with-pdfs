import { auth } from "@clerk/nextjs/server";

import { mapDbError, query } from "@/lib/db";
import { RAGError } from "@/lib/errors";
import type { DocumentSetRow } from "@/lib/supabase/types";

const DEFAULT_SET_NAME = "My documents";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new RAGError("Authentication required.", "unauthorized", 401);
  }

  return userId;
}

export async function ensureDefaultDocumentSet(userId: string): Promise<DocumentSetRow> {
  try {
    const existing = await query<DocumentSetRow>(
      `SELECT * FROM document_sets
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const created = await query<DocumentSetRow>(
      `INSERT INTO document_sets (user_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, DEFAULT_SET_NAME],
    );

    if (!created.rows[0]) {
      throw new RAGError("Failed to create document set.", "database_error", 500);
    }

    return created.rows[0];
  } catch (error) {
    if (error instanceof RAGError) throw error;
    throw mapDbError(error);
  }
}

export async function listDocumentSets(userId: string): Promise<DocumentSetRow[]> {
  try {
    const result = await query<DocumentSetRow>(
      `SELECT * FROM document_sets
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId],
    );

    return result.rows;
  } catch (error) {
    if (error instanceof RAGError) throw error;
    throw mapDbError(error);
  }
}

export async function requireDocumentSetAccess(
  userId: string,
  documentSetId: string,
): Promise<DocumentSetRow> {
  try {
    const result = await query<DocumentSetRow>(
      `SELECT * FROM document_sets
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [documentSetId, userId],
    );

    if (!result.rows[0]) {
      throw new RAGError("Document set not found.", "not_found", 404);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof RAGError) throw error;
    throw mapDbError(error);
  }
}

export async function resolveDocumentSetId(
  userId: string,
  documentSetId?: string | null,
): Promise<string> {
  if (documentSetId) {
    await requireDocumentSetAccess(userId, documentSetId);
    return documentSetId;
  }

  const defaultSet = await ensureDefaultDocumentSet(userId);
  return defaultSet.id;
}
