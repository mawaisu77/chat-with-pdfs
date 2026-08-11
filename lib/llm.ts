import OpenAI, {
  APIConnectionError,
  APIError,
  RateLimitError,
} from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { env } from "@/lib/env";

export type ChatMessage = ChatCompletionMessageParam;

export type ChatOptions = {
  model?: string;
  temperature?: number;
};

export class LLMError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryAfter?: number;

  constructor(
    message: string,
    code: string,
    status?: number,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "LLMError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function getApiKey(): string {
  try {
    return env.openai.apiKey();
  } catch {
    throw new LLMError(
      "OPENAI_API_KEY is not set. Add it to .env.local.",
      "missing_api_key",
      503,
    );
  }
}

function getModel(): string {
  return env.openai.chatModel();
}

function createClient(): OpenAI {
  return new OpenAI({ apiKey: getApiKey() });
}

/** Fail fast before starting a stream or chat call. */
export function assertLLMConfigured(): void {
  getApiKey();
}

function mapOpenAIError(error: unknown): LLMError {
  if (error instanceof LLMError) {
    return error;
  }

  if (error instanceof RateLimitError) {
    const retryAfterHeader = error.headers?.get("retry-after");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

    return new LLMError(
      "Rate limit reached. Please wait a moment and try again.",
      "rate_limit",
      429,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }

  if (error instanceof APIConnectionError) {
    return new LLMError(
      "Could not reach the model provider. Check your connection.",
      "connection_error",
      503,
    );
  }

  if (error instanceof APIError) {
    return new LLMError(
      error.message || "The model provider returned an error.",
      "api_error",
      error.status,
    );
  }

  if (error instanceof Error) {
    return new LLMError(error.message, "unknown_error", 500);
  }

  return new LLMError("An unexpected error occurred.", "unknown_error", 500);
}

export async function chat(
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<string> {
  try {
    const client = createClient();
    const model = options?.model ?? getModel();

    const completion = await client.chat.completions.create({
      model,
      messages,
      ...(options?.temperature !== undefined && {
        temperature: options.temperature,
      }),
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new LLMError("Model returned an empty response.", "empty_response", 502);
    }

    return content;
  } catch (error) {
    throw mapOpenAIError(error);
  }
}

export async function* chatStream(
  messages: ChatMessage[],
  options?: ChatOptions,
): AsyncGenerator<string, void, undefined> {
  let stream;

  try {
    const client = createClient();
    const model = options?.model ?? getModel();

    stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      ...(options?.temperature !== undefined && {
        temperature: options.temperature,
      }),
    });
  } catch (error) {
    throw mapOpenAIError(error);
  }

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;

      if (delta) {
        yield delta;
      }
    }
  } catch (error) {
    throw mapOpenAIError(error);
  }
}
