/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? "";

function getClient() {
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY가 없습니다. .env에 추가하거나 Google AI Studio에서 API 키를 발급하세요."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/** Gemini로 텍스트 생성 (한 번에 응답) */
export async function generateText(
  prompt: string,
  options?: { model?: string }
): Promise<string> {
  const ai = getClient();
  const model = options?.model ?? "gemini-2.0-flash";
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return response.text ?? "";
}

/** 스트리밍으로 텍스트 생성 (청크마다 받기) */
export async function* generateTextStream(
  prompt: string,
  options?: { model?: string }
): AsyncGenerator<string> {
  const ai = getClient();
  const model = options?.model ?? "gemini-2.0-flash";
  const stream = await ai.models.generateContentStream({
    model,
    contents: prompt,
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

/** Gemini 사용 가능 여부 (API 키 설정됐는지) */
export function isGeminiAvailable(): boolean {
  return Boolean(apiKey);
}
