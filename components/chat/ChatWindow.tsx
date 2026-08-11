"use client";

import { useEffect, useRef, useState } from "react";

import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { useChatSession } from "@/components/providers/ChatProvider";
import { useDashboardUI } from "@/components/providers/DashboardUIProvider";
import { useDocuments } from "@/components/providers/DocumentsProvider";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { DocumentUpload } from "./DocumentUpload";
import { MessageList } from "./MessageList";

export function ChatWindow() {
  const { ragReady, isUploading, uploadDocuments, uploadProgress, documentSetId, error: workspaceError, documents } =
    useDocuments();
  const { openSettings } = useDashboardUI();
  const { activeChatId, selectChat } = useChatSession();
  const {
    messages,
    input,
    setInput,
    isLoading,
    error: chatError,
    sendMessage,
    sendSuggestion,
    loadMessages,
    clearMessages,
  } = useChat(ragReady, documentSetId, activeChatId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);

  const readyDocCount = documents.filter((doc) => doc.status === "ready").length;

  useEffect(() => {
    if (!activeChatId) {
      clearMessages();
      return;
    }

    if (isLoading) return;

    void selectChat(activeChatId)
      .then((items) => loadMessages(items))
      .catch(() => clearMessages());
  }, [activeChatId, clearMessages, isLoading, loadMessages, selectChat]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  }

  useEffect(() => {
    if (stickToBottom) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages, stickToBottom]);

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    setStickToBottom(nearBottom);
    setShowScrollButton(distanceFromBottom > 200);
  }

  async function handleSend() {
    await sendMessage();
    setStickToBottom(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const chatOnlyError = chatError && chatError !== workspaceError ? chatError : null;

  return (
    <section className="flex h-full flex-col bg-background">
      <header className="relative z-30 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">Workspace</h1>
              <Badge variant={ragReady ? "success" : "muted"} dot>
                {ragReady ? "RAG ready" : "No docs"}
              </Badge>
              {readyDocCount > 0 && (
                <span className="text-[11px] text-muted-subtle">
                  {readyDocCount} doc{readyDocCount > 1 ? "s" : ""} indexed
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              Upload files, ask questions, get cited answers.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <DocumentUpload
              onUploadMany={uploadDocuments}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
            <ProfileMenu onOpenSettings={openSettings} />
          </div>
        </div>
      </header>

      {chatOnlyError && (
        <div className="shrink-0 border-b border-danger/20 bg-danger-subtle px-4 py-2.5 text-sm text-danger sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {chatOnlyError}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onSuggestionClick={(text) => void sendSuggestion(text)}
            />
          </div>
        </div>

        {showScrollButton && (
          <Button
            type="button"
            variant="icon"
            onClick={() => {
              setStickToBottom(true);
              scrollToBottom();
            }}
            aria-label="Scroll to latest"
            className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full border-brand-border/30 bg-background/90 shadow-lg backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        )}
      </div>

      <ChatInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSend()}
        isLoading={isLoading}
        placeholder={
          ragReady
            ? "Ask about your uploaded documents…"
            : "Upload a document or ask a general question…"
        }
      />
    </section>
  );
}
