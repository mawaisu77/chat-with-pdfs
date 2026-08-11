"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { RAGDocument } from "@/types/chat";

type DocumentSet = {
  id: string;
  name: string;
};

export type UploadProgress = {
  current: number;
  total: number;
  filename: string;
};

type DocumentsContextValue = {
  documentSetId: string | null;
  documentSets: DocumentSet[];
  documents: RAGDocument[];
  ragReady: boolean;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  refresh: () => Promise<void>;
  switchDocumentSet: (id: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  removeDocument: (documentId: string, source: string) => Promise<void>;
};

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documentSetId, setDocumentSetId] = useState<string | null>(null);
  const [documentSets, setDocumentSets] = useState<DocumentSet[]>([]);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocumentsForSet = useCallback(async (setId: string) => {
    const docsResponse = await fetch(
      `/api/documents?documentSetId=${encodeURIComponent(setId)}`,
    );

    if (!docsResponse.ok) {
      throw new Error("Failed to load documents.");
    }

    const docsData = (await docsResponse.json()) as { documents?: RAGDocument[] };
    setDocuments(docsData.documents ?? []);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const setsResponse = await fetch("/api/document-sets");

      if (!setsResponse.ok) {
        let message = "Failed to load document sets.";

        try {
          const errorBody = (await setsResponse.json()) as { error?: string; code?: string };
          if (errorBody.error) {
            message = errorBody.error;
          } else if (setsResponse.status === 503) {
            message =
              'Database is not configured. Set DATABASE_URL in .env.local and run "npm run db:migrate".';
          }
        } catch {
          message =
            setsResponse.status >= 500
              ? 'Server could not reach the database. Check DATABASE_URL and run "npm run db:check".'
              : `Failed to load document sets (HTTP ${setsResponse.status}).`;
        }

        throw new Error(message);
      }

      const setsData = (await setsResponse.json()) as {
        documentSets?: DocumentSet[];
        activeDocumentSetId?: string;
      };

      const sets = setsData.documentSets ?? [];
      const activeId = setsData.activeDocumentSetId ?? sets[0]?.id ?? null;

      setDocumentSets(sets);
      setDocumentSetId(activeId);

      if (!activeId) {
        setDocuments([]);
        return;
      }

      await loadDocumentsForSet(activeId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspace.";
      setError(message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadDocumentsForSet]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const refresh = useCallback(async () => {
    if (!documentSetId) {
      await loadWorkspace();
      return;
    }

    try {
      await loadDocumentsForSet(documentSetId);
    } catch {
      setDocuments([]);
    }
  }, [documentSetId, loadDocumentsForSet, loadWorkspace]);

  const switchDocumentSet = useCallback(
    async (id: string) => {
      setDocumentSetId(id);
      setIsLoading(true);
      setError(null);

      try {
        await loadDocumentsForSet(id);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to switch document set.";
        setError(message);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [loadDocumentsForSet],
  );

  const uploadSingleFile = useCallback(
    async (file: File, setId: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentSetId", setId);

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || `Upload failed for ${file.name}.`);
      }
    },
    [],
  );

  const uploadDocument = useCallback(
    async (file: File) => {
      if (!documentSetId) {
        throw new Error("No document set available.");
      }

      setIsUploading(true);
      setUploadProgress({ current: 1, total: 1, filename: file.name });
      setError(null);

      try {
        await uploadSingleFile(file, documentSetId);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [documentSetId, refresh, uploadSingleFile],
  );

  const uploadDocuments = useCallback(
    async (files: File[]) => {
      if (!documentSetId) {
        throw new Error("No document set available.");
      }

      if (files.length === 0) return;

      setIsUploading(true);
      setError(null);

      const failures: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadProgress({
          current: index + 1,
          total: files.length,
          filename: file.name,
        });

        try {
          await uploadSingleFile(file, documentSetId);
        } catch (err) {
          const detail =
            err instanceof Error ? err.message : `Failed to upload ${file.name}.`;
          failures.push(`${file.name}: ${detail}`);
        }
      }

      await refresh();
      setIsUploading(false);
      setUploadProgress(null);

      if (failures.length > 0) {
        const message =
          failures.length === files.length
            ? failures[0]
            : `${failures.length} of ${files.length} uploads failed.`;
        setError(message);
        return;
      }
    },
    [documentSetId, refresh, uploadSingleFile],
  );

  const removeDocument = useCallback(
    async (documentId: string, _source: string) => {
      if (!documentSetId) return;

      const previous = documents;
      setDocuments((current) => current.filter((doc) => doc.id !== documentId));

      try {
        const response = await fetch(
          `/api/documents?id=${encodeURIComponent(documentId)}&documentSetId=${encodeURIComponent(documentSetId)}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Delete failed.");
        }
      } catch (err) {
        setDocuments(previous);
        const message =
          err instanceof Error ? err.message : "Delete failed. Please try again.";
        setError(message);
        throw err;
      }
    },
    [documentSetId, documents],
  );

  return (
    <DocumentsContext.Provider
      value={{
        documentSetId,
        documentSets,
        documents,
        ragReady: documents.some((doc) => doc.status === "ready"),
        isLoading,
        isUploading,
        uploadProgress,
        error,
        refresh,
        switchDocumentSet,
        uploadDocument,
        uploadDocuments,
        removeDocument,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);

  if (!context) {
    throw new Error("useDocuments must be used within a DocumentsProvider");
  }

  return context;
}
