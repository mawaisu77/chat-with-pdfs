import { NextRequest } from "next/server";

import {
  ensureDefaultDocumentSet,
  listDocumentSets,
  requireUserId,
} from "@/lib/document-sets";
import { mapDbError, query } from "@/lib/db";
import { RAGError } from "@/lib/errors";

export const runtime = "nodejs";

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const sets = await listDocumentSets(userId);

    if (sets.length === 0) {
      const defaultSet = await ensureDefaultDocumentSet(userId);
      return Response.json({ documentSets: [defaultSet], activeDocumentSetId: defaultSet.id });
    }

    return Response.json({
      documentSets: sets,
      activeDocumentSetId: sets[0].id,
    });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    if (error instanceof Error) {
      return ragErrorResponse(mapDbError(error));
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() || "My documents";

    const result = await query(
      `INSERT INTO document_sets (user_id, name) VALUES ($1, $2) RETURNING *`,
      [userId, name],
    );

    if (!result.rows[0]) {
      throw new RAGError("Failed to create document set.", "database_error", 500);
    }

    return Response.json({ documentSet: result.rows[0] });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    if (error instanceof Error) {
      return ragErrorResponse(mapDbError(error));
    }

    throw error;
  }
}
