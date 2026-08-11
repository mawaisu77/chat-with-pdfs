"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { DashboardUIProvider } from "@/components/providers/DashboardUIProvider";
import { DocumentsProvider, useDocuments } from "@/components/providers/DocumentsProvider";
import { ChatProvider } from "@/components/providers/ChatProvider";

import { SetupBanner } from "./SetupBanner";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/Button";

type DashboardShellProps = {
  children: ReactNode;
};

function DashboardShellContent({ children }: DashboardShellProps) {
  const { documentSetId } = useDocuments();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ChatProvider documentSetId={documentSetId}>
      <div className="flex h-dvh overflow-hidden">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background md:flex">
          <div className="border-b border-border px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(56,189,248,0.35)]">
                PC
              </span>
              <span className="text-sm">PDF Chat</span>
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Sidebar />
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-background shadow-float">
              <div className="border-b border-border px-4 py-4">
                <span className="text-sm font-semibold">PDF Chat</span>
              </div>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col bg-background-subtle/30">
          <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-md md:hidden">
            <Button
              type="button"
              variant="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
            <span className="text-sm font-semibold">PDF Chat</span>
          </div>

          <SetupBanner />

          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </ChatProvider>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <DocumentsProvider>
      <DashboardUIProvider>
        <DashboardShellContent>{children}</DashboardShellContent>
      </DashboardUIProvider>
    </DocumentsProvider>
  );
}
