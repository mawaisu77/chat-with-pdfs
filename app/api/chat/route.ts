import { NextRequest } from "next/server";

import { chat, chatStream, assertLLMConfigured, LLMError, type ChatMessage } from "@/lib/llm";

export const runtime = "nodejs";

type ChatRequestBody = {
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
};

function llmErrorResponse(error: LLMError) {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (error.retryAfter !== undefined) {
    headers.set("Retry-After", String(error.retryAfter));
  }

  return new Response(
    JSON.stringify({ error: error.message, code: error.code }),
    { status: error.status ?? 500, headers },
  );
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array." },
      { status: 400 },
    );
  }

  const options = body.model ? { model: body.model } : undefined;

  try {
    assertLLMConfigured();
  } catch (error) {
    if (error instanceof LLMError) {
      return llmErrorResponse(error);
    }

    throw error;
  }

  if (body.stream) {
    try {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const token of chatStream(body.messages, options)) {
              controller.enqueue(encoder.encode(token));
            }

            controller.close();
          } catch (error) {
            const llmError =
              error instanceof LLMError
                ? error
                : new LLMError("Stream failed.", "stream_error", 500);

            controller.error(llmError);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      if (error instanceof LLMError) {
        return llmErrorResponse(error);
      }

      throw error;
    }
  }

  try {
    const answer = await chat(body.messages, options);
    return Response.json({ message: answer });
  } catch (error) {
    if (error instanceof LLMError) {
      return llmErrorResponse(error);
    }

    throw error;
  }
}
