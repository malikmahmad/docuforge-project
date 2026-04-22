import OpenAI from "openai";

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

function createGeminiOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

interface GenerateWithFallbackInput {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateGeminiWithOpenAI({
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.55,
  maxTokens = 8192,
}: GenerateWithFallbackInput): Promise<string> {
  const errors: string[] = [];

  for (let i = 0; i < geminiApiKeys.length; i += 1) {
    const apiKey = geminiApiKeys[i];
    const client = createGeminiOpenAIClient(apiKey);

    try {
      const completion = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim() || "";
      
      if (!content) {
        throw new Error("Empty response from API");
      }

      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`key #${i + 1}: ${message}`);
    }
  }

  throw new Error(`All Gemini API keys failed. ${errors.join(" | ")}`);
}
