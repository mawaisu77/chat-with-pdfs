"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";

type SettingsViewProps = {
  name: string;
  email: string;
  imageUrl: string | null;
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsView({ name, email, imageUrl }: SettingsViewProps) {
  const [ragReady, setRagReady] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [citations, setCitations] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ingest")
      .then((response) => (response.ok ? response.json() : { ready: false }))
      .then((data: { ready?: boolean }) => {
        if (!cancelled) setRagReady(Boolean(data.ready));
      })
      .catch(() => {
        if (!cancelled) setRagReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-background-subtle">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage your profile and assistant preferences.
          </p>
        </header>

        <div className="flex flex-col gap-5">
          <Card title="Profile" description="Your account details from Clerk.">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-background-subtle text-lg font-semibold text-brand">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-sm text-muted">{email}</p>
              </div>
            </div>
          </Card>

          <Card
            title="Assistant preferences"
            description="Control how the chat assistant behaves."
          >
            <ul className="divide-y divide-border">
              <li className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">Stream responses</p>
                  <p className="text-sm text-muted">
                    Show answers token-by-token as they generate.
                  </p>
                </div>
                <Toggle
                  enabled={streaming}
                  onChange={setStreaming}
                  label="Toggle streaming responses"
                />
              </li>
              <li className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">Show citations</p>
                  <p className="text-sm text-muted">
                    Display source documents under grounded answers.
                  </p>
                </div>
                <Toggle
                  enabled={citations}
                  onChange={setCitations}
                  label="Toggle citations"
                />
              </li>
            </ul>
          </Card>

          <Card
            title="Knowledge base"
            description="Documents indexed for retrieval-augmented answers."
          >
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background-subtle p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    ragReady
                      ? "bg-success-subtle text-success"
                      : "bg-background text-muted"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
                    <path
                      d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {ragReady ? "RAG is ready" : "No documents indexed"}
                  </p>
                  <p className="text-sm text-muted">
                    {ragReady
                      ? "Your questions will be answered from uploaded files."
                      : "Upload a document from the dashboard to enable RAG."}
                  </p>
                </div>
              </div>
              <Badge variant={ragReady ? "success" : "muted"}>
                {ragReady ? "Active" : "Idle"}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
