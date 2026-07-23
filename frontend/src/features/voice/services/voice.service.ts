import apiClient from "@/lib/axios";

export type VoiceContext = "sale" | "expense" | "menu" | "customer";

export interface VoiceParseResult<T = Record<string, unknown>> {
  transcript: string;
  extracted: T;
}

export async function parseVoiceEntry<T = Record<string, unknown>>(
  context: VoiceContext,
  audioBlob: Blob
): Promise<VoiceParseResult<T>> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("context", context);

  const response = await apiClient.post("/voice/parse", formData, {
    // Let the browser set the multipart boundary itself — do NOT set
    // Content-Type: application/json here (that's apiClient's default).
    headers: { "Content-Type": "multipart/form-data" },
    // STT + LLM round trip can comfortably exceed the client's default
    // 15s timeout, especially on slower connections or longer recordings.
    timeout: 30000,
  });

  // apiClient's response interceptor unwraps `{ success, data, message }`
  // shapes but only rewrites `response.data` when `data.pagination` exists;
  // for this endpoint response.data is already `{ success, data: { transcript, extracted }, message }`
  return response.data.data as VoiceParseResult<T>;
}