import { NextRequest } from "next/server";

import { resolveDocumentSetId, requireUserId } from "@/lib/document-sets";
import { RAGError } from "@/lib/errors";
import { assertLLMConfigured, LLMError } from "@/lib/llm";
import { queryRAG, queryRAGStream } from "@/lib/rag";

export const runtime = "nodejs";

type RAGRequestBody = {
  question: string;
  stream?: boolean;
  documentSetId?: string;
};

function ragErrorResponse(error: RAGError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}

function llmErrorResponse(error: LLMError) {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status ?? 500 },
  );
}

export async function POST(request: NextRequest) {
  let body: RAGRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.question?.trim()) {
    return Response.json({ error: "question is required." }, { status: 400 });
  }

  try {
    assertLLMConfigured();
  } catch (error) {
    if (error instanceof LLMError) {
      return llmErrorResponse(error);
    }

    throw error;
  }

  try {
    const userId = await requireUserId();
    const documentSetId = await resolveDocumentSetId(userId, body.documentSetId);

    if (body.stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = "";

            for await (const event of queryRAGStream(documentSetId, body.question)) {
              if (event.type === "sources") {
                controller.enqueue(
                  encoder.encode(
                    `${JSON.stringify({ type: "sources", sources: event.sources })}\n`,
                  ),
                );
                continue;
              }

              fullText += event.content;
              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({ type: "token", content: fullText })}\n`,
                ),
              );
            }

            controller.close();
          } catch (error) {
            const message =
              error instanceof RAGError || error instanceof LLMError
                ? error.message
                : "Stream failed.";

            controller.enqueue(
              encoder.encode(`${JSON.stringify({ type: "error", error: message })}\n`),
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const result = await queryRAG(documentSetId, body.question);
    return Response.json(result);
  } catch (error) {
    if (error instanceof RAGError) return ragErrorResponse(error);
    if (error instanceof LLMError) return llmErrorResponse(error);
    throw error;
  }
}
