import { query } from "@/lib/db";
import { RAGError } from "@/lib/errors";
import { requireDocumentSetAccess } from "@/lib/document-sets";
import type { ChatRow, MessageRow } from "@/lib/supabase/types";
import type { RAGSource } from "@/types/chat";

export type ChatSummary = {
  id: string;
  title: string;
  documentSetId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatRowWithCount = ChatRow & { message_count?: number };

export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RAGSource[];
  createdAt: string;
};

function mapChat(row: ChatRowWithCount): ChatSummary {
  return {
    id: row.id,
    title: row.title,
    documentSetId: row.document_set_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count ?? 0,
  };
}

function mapMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    sources: (row.sources as RAGSource[] | null) ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listChats(
  userId: string,
  documentSetId: string,
): Promise<ChatSummary[]> {
  await requireDocumentSetAccess(userId, documentSetId);

  const result = await query<ChatRowWithCount>(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM messages m WHERE m.chat_id = c.id) AS message_count
     FROM chats c
     WHERE c.user_id = $1 AND c.document_set_id = $2
     ORDER BY c.updated_at DESC`,
    [userId, documentSetId],
  );

  return result.rows.map(mapChat);
}

export async function createChat(
  userId: string,
  documentSetId: string,
  title = "New chat",
): Promise<ChatSummary> {
  await requireDocumentSetAccess(userId, documentSetId);

  const result = await query<ChatRowWithCount>(
    `INSERT INTO chats (user_id, document_set_id, title)
     VALUES ($1, $2, $3)
     RETURNING *,
       (SELECT 0)::int AS message_count`,
    [userId, documentSetId, title],
  );

  if (!result.rows[0]) {
    throw new RAGError("Failed to create chat.", "database_error", 500);
  }

  return mapChat(result.rows[0]);
}

export async function requireChatAccess(userId: string, chatId: string): Promise<ChatRow> {
  const result = await query<ChatRow>(
    `SELECT * FROM chats
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [chatId, userId],
  );

  if (!result.rows[0]) {
    throw new RAGError("Chat not found.", "not_found", 404);
  }

  return result.rows[0];
}

export async function getChatWithMessages(
  userId: string,
  chatId: string,
): Promise<{ chat: ChatSummary; messages: StoredMessage[] }> {
  const chatRow = await requireChatAccess(userId, chatId);

  const result = await query<MessageRow>(
    `SELECT * FROM messages
     WHERE chat_id = $1
     ORDER BY created_at ASC`,
    [chatId],
  );

  return {
    chat: mapChat(chatRow),
    messages: result.rows.map(mapMessage),
  };
}

export async function deleteChat(userId: string, chatId: string): Promise<void> {
  await requireChatAccess(userId, chatId);

  await query(`DELETE FROM chats WHERE id = $1`, [chatId]);
}

export async function appendMessages(
  userId: string,
  chatId: string,
  items: Array<{
    role: "user" | "assistant";
    content: string;
    sources?: RAGSource[];
  }>,
): Promise<StoredMessage[]> {
  const chat = await requireChatAccess(userId, chatId);
  const saved: StoredMessage[] = [];

  for (const item of items) {
    const result = await query<MessageRow>(
      `INSERT INTO messages (chat_id, role, content, sources)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [chatId, item.role, item.content, item.sources ? JSON.stringify(item.sources) : null],
    );

    if (result.rows[0]) {
      saved.push(mapMessage(result.rows[0]));
    }
  }

  const firstUser = items.find((item) => item.role === "user");

  if (chat.title === "New chat" && firstUser) {
    const title =
      firstUser.content.length > 48
        ? `${firstUser.content.slice(0, 48).trim()}…`
        : firstUser.content.trim();

    await query(`UPDATE chats SET title = $1, updated_at = NOW() WHERE id = $2`, [title, chatId]);
  } else {
    await query(`UPDATE chats SET updated_at = NOW() WHERE id = $1`, [chatId]);
  }

  return saved;
}
