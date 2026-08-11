import { NextRequest } from "next/server";

import { resolveDocumentSetId, requireUserId } from "@/lib/document-sets";
import { RAGError } from "@/lib/errors";
import { deleteDocument, listDocuments } from "@/lib/rag";

export const runtime = "nodejs";

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

function getDocumentSetIdFromRequest(request: NextRequest) {
  return request.nextUrl.searchParams.get("documentSetId");
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const documentSetId = await resolveDocumentSetId(
      userId,
      getDocumentSetIdFromRequest(request),
    );
    const documents = await listDocuments(documentSetId);

    return Response.json({ documents, documentSetId });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get("id");
  const source = request.nextUrl.searchParams.get("source");

  if (!documentId && !source) {
    return Response.json({ error: "id or source is required." }, { status: 400 });
  }

  try {
    const userId = await requireUserId();
    const documentSetId = await resolveDocumentSetId(
      userId,
      getDocumentSetIdFromRequest(request),
    );

    let resolvedId = documentId;

    if (!resolvedId && source) {
      const documents = await listDocuments(documentSetId);
      const match = documents.find((doc) => doc.source === source);

      if (!match) {
        throw new RAGError("Document not found.", "not_found", 404);
      }

      resolvedId = match.id;
    }

    if (!resolvedId) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const result = await deleteDocument(documentSetId, resolvedId);
    return Response.json(result);
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}
