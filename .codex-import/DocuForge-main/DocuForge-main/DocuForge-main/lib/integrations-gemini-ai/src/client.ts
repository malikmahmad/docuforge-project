import { GoogleGenAI } from "@google/genai";

const preferredPrimaryApiKey = "24a1b0d2-d065-494c-b1d8-6cb4abd2413e";

const hardcodedGeminiKeys = [
  "AIzaSyD7RzzrZabOkLpzY9rOxmD6yzjkyU0DGUw",
  "AIzaSyAn4bMPZAdfV0RfEauF5HCHseYeE91fWJU",
  "AIzaSyBeQzDwBBU0fU04YxKEka_j1Fz7WGRlreg",
  "AIzaSyBD9d7xr7Q2Cznq7kI05rWZa7wYaNy_59U",
  "AIzaSyB7BFZsRKKqXdhKTQjtN2svSVZigrQ4IJU",
];

const envKeyList = (process.env.AI_INTEGRATIONS_GEMINI_API_KEYS ?? "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

const configuredKeys = [
  preferredPrimaryApiKey,
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  ...envKeyList,
  ...hardcodedGeminiKeys,
]
  .map((key) => key?.trim())
  .filter((key): key is string => Boolean(key));

const seen = new Set<string>();
const geminiApiKeys = configuredKeys.filter((key) => {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (geminiApiKeys.length === 0) {
  throw new Error(
    "At least one Gemini API key is required. Set AI_INTEGRATIONS_GEMINI_API_KEY or AI_INTEGRATIONS_GEMINI_API_KEYS.",
  );
}

function normalizeBaseUrl(raw?: string): string {
  const input = (raw || "https://generativelanguage.googleapis.com").trim();
  const withoutTrailingSlash = input.replace(/\/+$/, "");

  // The @google/genai SDK expects the Google API root, not OpenAI compatibility path.
  // If callers provide .../v1beta/openai, normalize it to the root host.
  return withoutTrailingSlash
    .replace(/\/v1beta\/openai$/i, "")
    .replace(/\/openai$/i, "")
    .replace(/\/v1beta$/i, "");
}

const baseUrl = normalizeBaseUrl(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
const apiVersion = process.env.AI_INTEGRATIONS_GEMINI_API_VERSION?.trim() || "v1beta";

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion,
      baseUrl,
    },
  });
}

export const ai = createGeminiClient(geminiApiKeys[0]);

interface GenerateWithFallbackInput {
  model: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateGeminiWithFallback({
  model,
  prompt,
  temperature = 0.55,
  maxOutputTokens = 8192,
}: GenerateWithFallbackInput): Promise<string> {
  const errors: string[] = [];

  for (let i = 0; i < geminiApiKeys.length; i += 1) {
    const apiKey = geminiApiKeys[i];
    const client = createGeminiClient(apiKey);

    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens, temperature },
      });

      return (response.text ?? "").trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`key #${i + 1}: ${message}`);
    }
  }

  throw new Error(`All Gemini API keys failed. ${errors.join(" | ")}`);
}
