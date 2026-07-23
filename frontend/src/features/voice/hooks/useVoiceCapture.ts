"use client";

import { useState, useRef, useCallback } from "react";
import { parseVoiceEntry, type VoiceContext, type VoiceParseResult } from "../services/voice.service";

export type VoiceCaptureStatus = "idle" | "recording" | "processing" | "done" | "error";

export function useVoiceCapture<T = Record<string, unknown>>(context: VoiceContext) {
  const [status, setStatus] = useState<VoiceCaptureStatus>("idle");
  const [result, setResult] = useState<VoiceParseResult<T> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone permission denied or unavailable.");
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setStatus("processing");

    recorder.onstop = async () => {
      // Always release the mic, regardless of upload outcome
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      if (blob.size === 0) {
        setError("Didn't catch anything — try again.");
        setStatus("error");
        return;
      }

      try {
        const parsed = await parseVoiceEntry<T>(context, blob);
        setResult(parsed);
        setStatus("done");
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Couldn't process that recording — please try again or enter manually.";
        setError(message);
        setStatus("error");
      }
    };

    recorder.stop();
  }, [context]);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, start, stop, reset };
}