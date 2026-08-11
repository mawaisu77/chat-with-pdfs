import Link from "next/link";

import { AuthControls } from "@/components/layout/AuthControls";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-header backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]">
            PC
          </span>
          <span className="text-sm sm:text-base">PDF Chat</span>
        </Link>
        <AuthControls />
      </div>
    </header>
  );
}
