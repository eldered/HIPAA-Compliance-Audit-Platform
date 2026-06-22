import Anthropic from "@anthropic-ai/sdk";
import { buildAreaPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { parseAreaResponse, type AreaResponse } from "@/lib/ai/schema";
import type { HipaaArea } from "@/types/domain";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20240620";
/** Cap document text per area to control token cost (design §5). */
const MAX_CHARS_PER_AREA = 18_000;

/**
 * Analyze one HIPAA area with Claude. Retries once on a malformed response,
 * then returns null so the caller can mark the area inconclusive (R4.5).
 */
export async function analyzeArea(
  area: HipaaArea,
  documentText: string,
): Promise<AreaResponse | null> {
  const text = documentText.slice(0, MAX_CHARS_PER_AREA);
  const prompt = buildAreaPrompt(area, text);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const parsed = parseAreaResponse(raw);
    if (parsed) return parsed;
  }

  return null;
}
