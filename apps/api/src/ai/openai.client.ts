import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";
import { ProxyAgent, fetch as undiciFetch } from "undici";

type OpenAiMessage = {
  role: "system" | "user";
  content: string;
};

const openAiProxyDispatcher = env.OPENAI_PROXY_URL
  ? new ProxyAgent({ uri: env.OPENAI_PROXY_URL })
  : undefined;
const OPENAI_REQUEST_TIMEOUT_MS = 300_000;

function buildChatCompletionsUrl() {
  const baseUrl = new URL(env.OPENAI_BASE_URL);
  if (baseUrl.pathname === "/") {
    baseUrl.pathname = "/v1";
  }

  return `${baseUrl.toString().replace(/\/+$/, "")}/chat/completions`;
}

export async function createJsonChatCompletion(messages: OpenAiMessage[]) {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(400, "OPENAI_API_KEY is not configured on the backend");
  }
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), OPENAI_REQUEST_TIMEOUT_MS);

  const response = await undiciFetch(buildChatCompletionsUrl(), {
    method: "POST",
    signal: abortController.signal,
    ...(openAiProxyDispatcher ? { dispatcher: openAiProxyDispatcher } : {}),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(502, `OpenAI request failed with status ${response.status}`, payload);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new HttpError(502, "OpenAI returned an empty decision payload");
  }

  return content;
}
