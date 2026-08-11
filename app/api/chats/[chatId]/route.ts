import { NextRequest } from "next/server";

import { appendMessages, deleteChat, getChatWithMessages } from "@/lib/chats";
import { requireUserId } from "@/lib/document-sets";
import { RAGError } from "@/lib/errors";
import type { RAGSource } from "@/types/chat";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ chatId: string }> };

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { chatId } = await context.params;
    const result = await getChatWithMessages(userId, chatId);

    return Response.json(result);
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { chatId } = await context.params;

    await deleteChat(userId, chatId);

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { chatId } = await context.params;
    const body = (await request.json()) as {
      messages?: Array<{
        role: "user" | "assistant";
        content: string;
        sources?: RAGSource[];
      }>;
    };

    if (!body.messages?.length) {
      return Response.json({ error: "messages are required." }, { status: 400 });
    }

    const saved = await appendMessages(userId, chatId, body.messages);

    return Response.json({ messages: saved });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}
