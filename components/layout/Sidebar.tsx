"use client";

import { useMemo, useState } from "react";

import { useChatSession } from "@/components/providers/ChatProvider";
import { useDocuments } from "@/components/providers/DocumentsProvider";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/cn";

type SidebarProps = {
  onNavigate?: () => void;
};

function ChatsSection({ onNavigate }: { onNavigate?: () => void }) {
  const { documentSetId } = useDocuments();
  const {
    activeChatId,
    chats,
    isLoadingChats,
    createNewChat,
    selectChat,
    deleteChatById,
  } = useChatSession();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleChats = useMemo(
    () =>
      chats.filter(
        (chat) => chat.messageCount > 0 || chat.id === activeChatId,
      ),
    [activeChatId, chats],
  );

  async function handleNewChat() {
    if (!documentSetId) return;
    await createNewChat(documentSetId);
    onNavigate?.();
  }

  async function handleSelectChat(chatId: string) {
    await selectChat(chatId);
    onNavigate?.();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteChatById(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <Button
          type="button"
          variant="soft"
          fullWidth
          className="mb-3 h-10 shrink-0"
          onClick={() => void handleNewChat()}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New chat
        </Button>

        {isLoadingChats ? (
          <p className="px-2 text-xs text-muted">Loading…</p>
        ) : visibleChats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs leading-relaxed text-muted">
            No conversations yet. Start one in the workspace.
          </p>
        ) : (
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {visibleChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const label =
                chat.title === "New chat" ? "New conversation" : chat.title;

              return (
                <li key={chat.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => void handleSelectChat(chat.id)}
                    title={label}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 pr-9 text-left transition-colors",
                      isActive
                        ? "bg-brand-subtle ring-1 ring-brand-border"
                        : "hover:bg-background-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "block truncate text-[13px] font-medium leading-snug",
                        isActive ? "text-brand" : "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-subtle">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${label}`}
                    onClick={() => setPendingDelete({ id: chat.id, title: label })}
                    className="absolute right-2 top-2 rounded-md p-1 text-muted opacity-0 transition-opacity hover:bg-danger-subtle hover:text-danger group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete chat?"
        description={`This will permanently delete "${pendingDelete?.title ?? "this chat"}".`}
        confirmLabel="Delete chat"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        isLoading={isDeleting}
      />
    </>
  );
}

function DocumentsSection() {
  const { documents, isLoading, removeDocument } = useDocuments();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; source: string } | null>(
    null,
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(pendingDelete.id);
    try {
      await removeDocument(pendingDelete.id, pendingDelete.source);
      setPendingDelete(null);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="mt-4 shrink-0 border-t border-border pt-4">
        <p className="mb-2 px-1 text-xs font-medium text-muted">
          Documents {documents.length > 0 && `(${documents.length})`}
        </p>

        <div className="max-h-36 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="px-1 text-xs text-muted">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted">
              Upload a PDF from the workspace header.
            </p>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="group flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-background-subtle"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug break-words" title={doc.source}>
                      {doc.source}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-subtle">
                      {doc.chunks} chunks · {doc.pages} pg
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.source}`}
                    disabled={deleting === doc.id}
                    onClick={() => setPendingDelete({ id: doc.id, source: doc.source })}
                    className="shrink-0 rounded p-1 text-muted opacity-0 hover:text-danger group-hover:opacity-100 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete document?"
        description={`Remove "${pendingDelete?.source ?? "this file"}"?`}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        isLoading={Boolean(deleting)}
      />
    </>
  );
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { documentSets, documentSetId, switchDocumentSet } = useDocuments();

  return (
    <div className="flex h-full flex-col p-3">
      {documentSets.length > 1 ? (
        <select
          value={documentSetId ?? ""}
          onChange={(event) => void switchDocumentSet(event.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-background-subtle px-3 py-2 text-xs text-foreground outline-none focus:border-brand-border"
        >
          {documentSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="mb-3 px-1 text-xs text-muted">
          {documentSets[0]?.name ?? "My documents"}
        </p>
      )}

      <ChatsSection onNavigate={onNavigate} />
      <DocumentsSection />
    </div>
  );
}
