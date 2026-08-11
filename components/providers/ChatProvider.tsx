"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { ChatMessageItem } from "@/types/chat";

type ChatSummary = {
  id: string;
  title: string;
  documentSetId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

function normalizeChat(raw: Record<string, unknown>): ChatSummary {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "New chat"),
    documentSetId: String(raw.documentSetId ?? raw.document_set_id ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
    messageCount: Number(raw.messageCount ?? raw.message_count ?? 0),
  };
}

type ChatContextValue = {
  activeChatId: string | null;
  chats: ChatSummary[];
  isLoadingChats: boolean;
  loadChats: (documentSetId: string) => Promise<void>;
  createNewChat: (documentSetId: string) => Promise<string>;
  selectChat: (chatId: string) => Promise<ChatMessageItem[]>;
  deleteChatById: (chatId: string) => Promise<void>;
  persistExchange: (
    chatId: string,
    userContent: string,
    assistantContent: string,
    sources?: ChatMessageItem["sources"],
  ) => Promise<void>;
  refreshChats: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  documentSetId,
}: {
  children: ReactNode;
  documentSetId: string | null;
}) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const loadChats = useCallback(async (setId: string) => {
    setIsLoadingChats(true);

    try {
      const response = await fetch(
        `/api/chats?documentSetId=${encodeURIComponent(setId)}`,
      );

      if (!response.ok) return;

      const data = (await response.json()) as { chats?: Array<Record<string, unknown>> };
      setChats((data.chats ?? []).map(normalizeChat));
    } catch {
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (!documentSetId) {
      setChats([]);
      setActiveChatId(null);
      return;
    }

    setActiveChatId(null);
    void loadChats(documentSetId);
  }, [documentSetId, loadChats]);

  const createNewChat = useCallback(
    async (setId: string) => {
      const existingEmpty = chats.find(
        (chat) => chat.title === "New chat" && chat.messageCount === 0,
      );

      if (existingEmpty) {
        setActiveChatId(existingEmpty.id);
        return existingEmpty.id;
      }

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentSetId: setId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat.");
      }

      const data = (await response.json()) as { chat: Record<string, unknown> };
      const chat = normalizeChat(data.chat);
      setActiveChatId(chat.id);
      setChats((current) => [chat, ...current.filter((item) => item.id !== chat.id)]);

      return chat.id;
    },
    [chats],
  );

  const selectChat = useCallback(async (chatId: string) => {
    const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`);

    if (!response.ok) {
      throw new Error("Failed to load chat.");
    }

    const data = (await response.json()) as {
      messages: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        sources?: ChatMessageItem["sources"];
      }>;
    };

    setActiveChatId(chatId);

    return data.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      sources: message.sources,
    }));
  }, []);

  const deleteChatById = useCallback(
    async (chatId: string) => {
      const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat.");
      }

      setChats((current) => current.filter((chat) => chat.id !== chatId));

      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    },
    [activeChatId],
  );

  const persistExchange = useCallback(
    async (
      chatId: string,
      userContent: string,
      assistantContent: string,
      sources?: ChatMessageItem["sources"],
    ) => {
      const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: userContent },
            { role: "assistant", content: assistantContent, sources },
          ],
        }),
      });

      if (!response.ok) return;

      if (documentSetId) {
        await loadChats(documentSetId);
      }
    },
    [documentSetId, loadChats],
  );

  const refreshChats = useCallback(async () => {
    if (!documentSetId) return;
    await loadChats(documentSetId);
  }, [documentSetId, loadChats]);

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        chats,
        isLoadingChats,
        loadChats,
        createNewChat,
        selectChat,
        deleteChatById,
        persistExchange,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatSession() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatSession must be used within a ChatProvider");
  }

  return context;
}
