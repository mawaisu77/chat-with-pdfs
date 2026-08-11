"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";

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
    <section className="glass-card rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsPanel() {
  const { user, isLoaded } = useUser();
  const [ragReady, setRagReady] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [citations, setCitations] = useState(true);

  const name = user?.fullName ?? user?.username ?? "there";
  const email = user?.primaryEmailAddress?.emailAddress ?? "Not available";
  const imageUrl = user?.imageUrl ?? null;

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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Profile" description="Your signed-in account.">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background-subtle text-base font-semibold text-brand">
            {imageUrl ? (
              <Image src={imageUrl} alt={name} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
        </div>
      </Card>

      <Card title="Assistant" description="How responses appear in chat.">
        <ul className="divide-y divide-border">
          <li className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Stream responses</p>
              <p className="text-xs text-muted">Show answers as they generate.</p>
            </div>
            <Toggle enabled={streaming} onChange={setStreaming} label="Toggle streaming" />
          </li>
          <li className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Show citations</p>
              <p className="text-xs text-muted">Display sources under answers.</p>
            </div>
            <Toggle enabled={citations} onChange={setCitations} label="Toggle citations" />
          </li>
        </ul>
      </Card>

      <Card title="Knowledge base" description="Indexed documents for RAG.">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background-subtle/60 p-3.5">
          <div>
            <p className="text-sm font-semibold">{ragReady ? "RAG is ready" : "No documents indexed"}</p>
            <p className="mt-0.5 text-xs text-muted">
              {ragReady ? "Answers use your uploaded files." : "Upload a PDF or text file to start."}
            </p>
          </div>
          <Badge variant={ragReady ? "success" : "muted"}>{ragReady ? "Active" : "Idle"}</Badge>
        </div>
      </Card>
    </div>
  );
}
