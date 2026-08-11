import { NextRequest } from "next/server";

import { createChat, listChats } from "@/lib/chats";
import { requireUserId, resolveDocumentSetId } from "@/lib/document-sets";
import { RAGError } from "@/lib/errors";

export const runtime = "nodejs";

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const documentSetId = await resolveDocumentSetId(
      userId,
      request.nextUrl.searchParams.get("documentSetId"),
    );
    const chats = await listChats(userId, documentSetId);

    return Response.json({ chats, documentSetId });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await request.json()) as {
      documentSetId?: string;
      title?: string;
    };

    const documentSetId = await resolveDocumentSetId(userId, body.documentSetId);
    const chat = await createChat(userId, documentSetId, body.title?.trim() || "New chat");

    return Response.json({ chat });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}
