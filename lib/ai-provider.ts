import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiProvider = "global-ai" | "local-ai";

type GenerateModelConfig = {
  provider?: string;
  model?: string;
  temperature?: number;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

const GEMINI_KEYS = (
  process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ""
)
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral:latest";

let keyIndex = 0;

export const normalizeAiProvider = (value?: string | null): AiProvider =>
  value === "local-ai" ? "local-ai" : "global-ai";

class OllamaTextModel {
  constructor(
    private readonly config: {
      baseUrl: string;
      model: string;
      temperature: number;
    },
  ) {}

  async generateContent(prompt: string) {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: this.config.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama request failed with status ${response.status} (${response.statusText})`,
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    if (typeof data.response !== "string" || !data.response.trim()) {
      throw new Error(data.error || "Ollama returned an empty response");
    }

    return {
      response: {
        text: () => data.response as string,
      },
    };
  }
}

const createGeminiModel = (config?: GenerateModelConfig) => {
  if (GEMINI_KEYS.length === 0) {
    throw new Error(
      "No Gemini API keys configured. Set GEMINI_API_KEYS or GEMINI_API_KEY in .env",
    );
  }

  const key = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
  keyIndex += 1;

  const genAI = new GoogleGenerativeAI(key);

  return genAI.getGenerativeModel({
    model: config?.model || "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: config?.temperature ?? 0.3,
    },
  });
};

export const getGenerationModel = (config?: GenerateModelConfig) => {
  const provider = normalizeAiProvider(config?.provider);

  if (provider === "local-ai") {
    return new OllamaTextModel({
      baseUrl: OLLAMA_BASE_URL,
      model: config?.model || OLLAMA_MODEL,
      temperature: config?.temperature ?? 0.3,
    });
  }

  return createGeminiModel(config);
};
