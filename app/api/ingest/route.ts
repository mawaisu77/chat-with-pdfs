import { NextRequest } from "next/server";

import { resolveDocumentSetId, requireUserId } from "@/lib/document-sets";
import { env } from "@/lib/env";
import { RAGError } from "@/lib/errors";
import {
  getRAGStatus,
  ingestDocument,
} from "@/lib/rag";
import {
  isSupportedFile,
  parseFileBuffer,
  parseTextContent,
} from "@/lib/fileParser";

export const runtime = "nodejs";

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

function getDocumentSetIdFromRequest(request: NextRequest) {
  return request.nextUrl.searchParams.get("documentSetId");
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const documentSetId = await resolveDocumentSetId(
      userId,
      getDocumentSetIdFromRequest(request),
    );
    const status = await getRAGStatus(documentSetId);

    return Response.json(status);
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const documentSetId = await resolveDocumentSetId(
        userId,
        (formData.get("documentSetId") as string | null) ||
          getDocumentSetIdFromRequest(request),
      );

      if (!(file instanceof File)) {
        return Response.json({ error: "File is required." }, { status: 400 });
      }

      if (!isSupportedFile(file.name)) {
        return Response.json(
          { error: "Only .txt, .md, .csv, .json, and .pdf files are supported." },
          { status: 400 },
        );
      }

      if (file.size > env.rag.maxUploadBytes()) {
        return Response.json(
          {
            error: `File exceeds the ${Math.round(env.rag.maxUploadBytes() / (1024 * 1024))} MB limit.`,
          },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseFileBuffer(buffer, file.name);
      const result = await ingestDocument(
        documentSetId,
        parsed,
        buffer,
        file.type || undefined,
      );

      return Response.json({ ...result, documentSetId });
    }

    const body = (await request.json()) as {
      text?: string;
      source?: string;
      documentSetId?: string;
    };

    const documentSetId = await resolveDocumentSetId(userId, body.documentSetId);
    const parsed = await parseTextContent(body.text || "", body.source || "manual-text");
    const result = await ingestDocument(documentSetId, parsed);

    return Response.json({ ...result, documentSetId });
  } catch (error) {
    if (error instanceof RAGError) {
      return ragErrorResponse(error);
    }

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
