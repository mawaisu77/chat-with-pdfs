"use client";

import { ChangeEvent, useRef } from "react";

import { Button } from "@/components/ui/Button";
import type { UploadProgress } from "@/components/providers/DocumentsProvider";

type DocumentUploadProps = {
  onUploadMany: (files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
};

export function DocumentUpload({
  onUploadMany,
  isUploading,
  uploadProgress,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;

    if (!fileList?.length) return;

    const files = Array.from(fileList);

    try {
      await onUploadMany(files);
    } catch {
      // error is surfaced via DocumentsProvider and ChatWindow banner
    } finally {
      event.target.value = "";
    }
  }

  const progressLabel =
    uploadProgress && uploadProgress.total > 1
      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}: ${uploadProgress.filename}`
      : uploadProgress
        ? `Uploading ${uploadProgress.filename}`
        : null;

  return (
    <div className="flex items-center gap-2">
      <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.csv,.json,.pdf"
          multiple
          className="hidden"
          onChange={(event) => void handleChange(event)}
        />

        <Button
          type="button"
          variant="upload"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M12 16V4M7 9l5-5 5 5M5 20h14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {isUploading ? "Uploading..." : "Upload"}
        </Button>

        {progressLabel && (
          <span className="hidden max-w-[10rem] truncate text-xs text-muted lg:inline" title={progressLabel}>
            {progressLabel}
          </span>
        )}
    </div>
  );
}
