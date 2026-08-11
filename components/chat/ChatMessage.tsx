"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { MessageContent } from "./MessageContent";
import type { ChatMessageItem } from "@/types/chat";

type ChatMessageProps = {
  message: ChatMessageItem;
};

function Avatar({ isUser }: { isUser: boolean }) {
  if (isUser) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
        aria-hidden="true"
      >
        You
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background-subtle text-brand shadow-sm"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <article
      className={cn(
        "group animate-rise flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar isUser={isUser} />

      <div
        className={cn(
          "flex min-w-0 flex-col gap-2",
          isUser ? "max-w-[85%] items-end sm:max-w-[72%]" : "max-w-[92%] flex-1 sm:max-w-[88%]",
        )}
      >
        <div
          className={cn(
            "relative w-full px-4 py-3",
            isUser
              ? "chat-bubble-user rounded-2xl rounded-tr-md"
              : "chat-bubble-assistant rounded-2xl rounded-tl-md",
          )}
        >
          {message.content ? (
            isUser ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white">
                {message.content}
                {message.streaming && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-full bg-white/80 align-middle" />
                )}
              </p>
            ) : (
              <MessageContent content={message.content} streaming={message.streaming} />
            )
          ) : message.streaming ? (
            <span className="flex gap-1 py-1" aria-label="Assistant is typing">
              <span className="typing-dot [animation-delay:0ms]" />
              <span className="typing-dot [animation-delay:150ms]" />
              <span className="typing-dot [animation-delay:300ms]" />
            </span>
          ) : null}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full space-y-2">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <div
                  key={`${source.source}-${source.page ?? "na"}-${source.section ?? index}`}
                  className="source-chip max-w-full"
                  title={source.preview}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true">
                    <path
                      d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="min-w-0 truncate font-medium">{source.source}</span>
                  <span className="shrink-0 text-muted-subtle">
                    {source.page ? `p.${source.page}` : ""}
                    {source.section ? ` · ${source.section}` : ""}
                  </span>
                  <span className="shrink-0 rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                    {Math.round(source.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isUser && message.content && !message.streaming && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1 px-2 py-0.5 text-[11px]"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
