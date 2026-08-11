"use client";

import { useDocuments } from "@/components/providers/DocumentsProvider";
import { Button } from "@/components/ui/Button";

export function SetupBanner() {
  const { error, isLoading, refresh } = useDocuments();

  if (isLoading || !error) return null;

  const isSetupError =
    error.includes("Database") ||
    error.includes("DATABASE_URL") ||
    error.includes("db:migrate") ||
    error.includes("document sets") ||
    error.includes("workspace");

  if (!isSetupError) return null;

  return (
    <div className="border-b border-brand-border bg-brand-subtle px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Database setup required</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{error}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-subtle">
            <li>Set <code className="text-brand">DATABASE_URL</code> to your Neon connection string</li>
            <li>Run <code className="text-brand">npm run db:migrate</code> in the ai-web-kit folder</li>
            <li>Restart the dev server</li>
          </ol>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
