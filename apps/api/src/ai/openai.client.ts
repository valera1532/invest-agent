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

export async function createJsonChatCompletion(messages: OpenAiMessage[]) {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(400, "OPENAI_API_KEY is not configured on the backend");
  }

  const response = await undiciFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
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
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(502, "OpenAI request failed", payload);
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
