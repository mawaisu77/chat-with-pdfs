"use client";

import { useCallback, useEffect, useState } from "react";

import { useChatSession } from "@/components/providers/ChatProvider";
import type { ChatMessageItem, RAGSource } from "@/types/chat";

type ApiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function createId() {
  return crypto.randomUUID();
}

async function streamChatResponse(
  messages: ApiMessage[],
  onToken: (text: string) => void,
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, stream: true }),
  });

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }

    throw new Error(message);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response stream available.");
  }

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    fullText += decoder.decode(value, { stream: true });
    onToken(fullText);
  }

  return fullText;
}

async function streamRagResponse(
  question: string,
  documentSetId: string,
  onUpdate: (update: { text?: string; sources?: RAGSource[] }) => void,
): Promise<{ text: string; sources: RAGSource[] }> {
  const response = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, stream: true, documentSetId }),
  });

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }

    throw new Error(message);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response stream available.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let sources: RAGSource[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = JSON.parse(line) as
        | { type: "sources"; sources: RAGSource[] }
        | { type: "token"; content: string }
        | { type: "error"; error: string };

      if (event.type === "sources") {
        sources = event.sources;
        onUpdate({ sources });
      }

      if (event.type === "token") {
        fullText = event.content;
        onUpdate({ text: fullText, sources });
      }

      if (event.type === "error") {
        throw new Error(event.error);
      }
    }
  }

  return { text: fullText, sources };
}

export function useChat(
  ragReady: boolean,
  documentSetId: string | null,
  chatId: string | null,
) {
  const { createNewChat, persistExchange } = useChatSession();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [chatId]);

  const ensureChatId = useCallback(async () => {
    if (chatId) return chatId;
    if (!documentSetId) throw new Error("No document set available.");
    return createNewChat(documentSetId);
  }, [chatId, createNewChat, documentSetId]);

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || isLoading) return;

      const userMessage: ChatMessageItem = {
        id: createId(),
        role: "user",
        content: trimmed,
      };

      const assistantId = createId();

      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setError(null);
      setIsLoading(true);

      try {
        const activeChatId = await ensureChatId();
        let assistantContent = "";
        let assistantSources: RAGSource[] | undefined;

        if (ragReady && documentSetId) {
          const result = await streamRagResponse(trimmed, documentSetId, ({ text, sources }) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: text ?? message.content,
                      sources: sources ?? message.sources,
                      streaming: true,
                    }
                  : message,
              ),
            );
          });

          assistantContent = result.text;
          assistantSources = result.sources;

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: result.text,
                    sources: result.sources,
                    streaming: false,
                  }
                : message,
            ),
          );
        } else {
          const apiMessages: ApiMessage[] = [
            ...messages.map(({ role, content }) => ({ role, content })),
            { role: "user", content: trimmed },
          ];

          const finalText = await streamChatResponse(apiMessages, (streamText) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: streamText, streaming: true }
                  : message,
              ),
            );
          });

          assistantContent = finalText;

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: finalText, streaming: false }
                : message,
            ),
          );
        }

        await persistExchange(activeChatId, trimmed, assistantContent, assistantSources);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";

        setError(message);
        setMessages((current) => current.filter((item) => item.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [documentSetId, ensureChatId, isLoading, messages, persistExchange, ragReady],
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");
    await submitMessage(trimmed);
  }, [input, submitMessage]);

  const sendSuggestion = useCallback(
    async (text: string) => {
      setInput("");
      await submitMessage(text);
    },
    [submitMessage],
  );

  const loadMessages = useCallback((items: ChatMessageItem[]) => {
    setMessages(items);
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    sendSuggestion,
    loadMessages,
    clearMessages,
  };
}
