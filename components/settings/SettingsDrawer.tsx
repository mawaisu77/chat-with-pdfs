"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Button } from "@/components/ui/Button";

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl animate-rise"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="settings-drawer-title" className="text-base font-semibold">
              Settings
            </h2>
            <p className="mt-0.5 text-xs text-muted">Profile & assistant preferences</p>
          </div>
          <Button type="button" variant="icon" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <SettingsPanel />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
