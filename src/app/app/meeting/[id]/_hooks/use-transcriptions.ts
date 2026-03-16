"use client";

import { isMeetingDebug } from "@/lib/debug";
import {
  getTranscriptionControlAccess,
  startTranscription as serverStartTranscription,
  stopTranscription as serverStopTranscription,
} from "@/server-actions/meeting-transcriptions";
import { useTranscription } from "@videosdk.live/react-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 4000;

export default function useTranscriptions({ roomId }: { roomId: string }) {
  // roomId here is the DB meeting UUID (meetingDbId)
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isLiveTranscriptionEnabled, setIsLiveTranscriptionEnabled] =
    useState<boolean>(false);
  const [hasTranscriptionControl, setHasTranscriptionControl] = useState(false);
  const [isTranscriptionRecording, setIsTranscriptionRecording] =
    useState(false);
  const [isTranscriptionLive, setIsTranscriptionLive] = useState(false);

  // Tracks the session ID returned by the server when recording starts.
  const recordingSessionIdRef = useRef<string | null>(null);
  // Tracks the polling interval so we can clear it reliably.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── VideoSDK transcription listeners ───────────────────────────────────────
  const { startTranscription: sdkStart, stopTranscription: sdkStop } =
    useTranscription({
      onTranscriptionStateChanged: (data) => {
        console.log("[Transcription] State changed:", data.status, data);
      },
      onTranscriptionText: (data) => {
        const { participantName, text } = data;
        const line = `${participantName}: ${text}`;
        console.log("[Transcription] Text received:", line);
        setTranscriptionText((prev) => (prev ? `${prev}\n${line}` : line));
      },
    });

  // ─── Permission check ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAccess = async () => {
      if (!roomId || isMeetingDebug()) return;

      const result = await getTranscriptionControlAccess(roomId);
      if (!result.success) {
        console.error("[Transcription] Failed to check access:", result.error);
        return;
      }
      setHasTranscriptionControl(Boolean(result.data?.canControl));
    };

    fetchAccess();
  }, [roomId]);

  // ─── Webhook readiness polling ────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("[Transcription] Polling stopped.");
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || !roomId) return;

    console.log("[Transcription] Polling for webhook readiness:", roomId);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/transcript-webhook/${roomId}/`);
        if (!res.ok) return;

        const json = (await res.json()) as {
          ready?: boolean;
          status?: string;
          transcriptText?: string | null;
          summaryText?: string | null;
          error?: string | null;
        };

        console.log("[Transcription] Poll response:", json);

        if (json.ready) {
          stopPolling();
          console.log("[Transcription] Transcript ready:", json);

          if (json.transcriptText) {
            console.log(
              "[Transcription] Received transcript text:\n",
              json.transcriptText,
            );
            setTranscriptionText(json.transcriptText);
          }
          if (json.summaryText) {
            console.log("[Transcription] Summary:", json.summaryText);
          }
        } else if (json.status === "failed") {
          stopPolling();
          console.error(
            "[Transcription] Webhook reported failure:",
            json.error,
          );
        }
      } catch (err) {
        console.error("[Transcription] Poll fetch error:", err);
      }
    }, POLL_INTERVAL_MS);
  }, [roomId, stopPolling]);

  // Stop polling on unmount.
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ─── Live transcription ───────────────────────────────────────────────────────
  const startLiveTranscription = useCallback(async () => {
    if (isTranscriptionLive) {
      console.warn("[Transcription] Live transcription already running.");
      return;
    }
    console.log("[Transcription] Starting live transcription …");
    setIsTranscriptionLive(true);
    setTranscriptionText("");

    const webhookBase =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "");

    sdkStart({
      webhookUrl: `${webhookBase}/api/transcript-webhook/${roomId}/`,
      summary: {
        enabled: true,
        prompt: "Summarize the meeting highlights and action items.",
      },
    });
  }, [isTranscriptionLive, roomId, sdkStart]);

  const stopLiveTranscription = useCallback(async () => {
    if (!isTranscriptionLive) {
      console.warn("[Transcription] Live transcription is not running.");
      return;
    }
    console.log("[Transcription] Stopping live transcription …");
    sdkStop();
    setIsTranscriptionLive(false);
  }, [isTranscriptionLive, sdkStop]);

  // ─── Recording transcription (server-side via VideoSDK API) ──────────────────
  const startRecordingTranscription = useCallback(async () => {
    if (isTranscriptionRecording) {
      console.warn("[Transcription] Recording transcription already running.");
      return;
    }
    console.log("[Transcription] Starting recording transcription …", roomId);
    setIsTranscriptionRecording(true);

    const result = await serverStartTranscription(roomId);
    if (!result.success) {
      console.error("[Transcription] Failed to start recording:", result.error);
      setIsTranscriptionRecording(false);
      return;
    }

    const sessionId = result.data?.id ?? null;
    recordingSessionIdRef.current = sessionId;
    console.log("[Transcription] Recording started; session:", sessionId);

    startPolling();
  }, [isTranscriptionRecording, roomId, startPolling]);

  const stopRecordingTranscription = useCallback(async () => {
    if (!isTranscriptionRecording) {
      console.warn("[Transcription] Recording transcription is not running.");
      return;
    }

    const sessionId = recordingSessionIdRef.current;
    if (!sessionId) {
      console.error("[Transcription] Cannot stop: no session ID captured.");
      setIsTranscriptionRecording(false);
      stopPolling();
      return;
    }

    console.log(
      "[Transcription] Stopping recording transcription …",
      sessionId,
    );
    stopPolling();

    const result = await serverStopTranscription(roomId, sessionId);
    if (!result.success) {
      console.error("[Transcription] Failed to stop recording:", result.error);
    } else {
      console.log("[Transcription] Recording stopped.");
    }

    recordingSessionIdRef.current = null;
    setIsTranscriptionRecording(false);
  }, [isTranscriptionRecording, roomId, stopPolling]);

  return {
    transcriptionText,
    setTranscriptionText,
    isLiveTranscriptionEnabled,
    setIsLiveTranscriptionEnabled,
    hasTranscriptionControl,
    isTranscriptionRecording,
    setIsTranscriptionRecording,
    isTranscriptionLive,
    setIsTranscriptionLive,
    startRecordingTranscription,
    stopRecordingTranscription,
    startLiveTranscription,
    stopLiveTranscription,
  };
}
