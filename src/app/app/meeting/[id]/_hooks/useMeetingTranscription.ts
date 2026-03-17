"use client";

import { isMeetingDebug } from "@/lib/debug";
import { useMeeting, useTranscription } from "@/lib/videosdkWrapper";
import {
  fetchTranscriptionText,
  getMeetingTranscripts,
  getTranscription,
  getTranscriptionControlAccess,
  saveTranscriptSegment,
} from "@/server-actions/meeting-transcriptions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_TRANSCRIPT_ENTRIES = 200;
const REALTIME_FALLBACK_POLL_MS = 5000;
const DUPLICATE_EVENT_WINDOW_MS = 2500;

export interface TranscriptionLogEntry {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
  type: string;
  isFinal: boolean;
}

export interface UseMeetingTranscriptionResult {
  hasTranscriptionControl: boolean;
  transcriptionStatus: string;
  activeSessionId: string | null;
  isTranscriptionLive: boolean;
  isActionPending: boolean;
  errorMessage: string | null;
  logs: TranscriptionLogEntry[];
  startLiveTranscription: () => Promise<void>;
  stopLiveTranscription: () => Promise<void>;
  clearLogs: () => void;
}

interface UseMeetingTranscriptionArgs {
  roomId: string;
  meetingDbId: string;
}

interface TranscriptionStateEvent {
  id: string;
  status: string;
}

interface TranscriptionTextEvent {
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
  type: string;
}

interface MinimalParticipant {
  id: string;
  displayName?: string;
  micOn?: boolean;
  mode?: "SEND_AND_RECV" | "SIGNALLING_ONLY" | "RECV_ONLY";
}

const normalizeStatus = (status: string | undefined): string => {
  if (!status) return "UNKNOWN";
  return status.toUpperCase();
};

const isPartialTranscript = (type: string | undefined): boolean => {
  if (!type) return false;
  const normalized = type.toLowerCase();
  return normalized.includes("partial") || normalized.includes("interim");
};

const isFinalTranscript = (type: string | undefined): boolean => {
  // VideoSDK event types vary across SDK/runtime paths.
  // Keep "final sentence mode" by dropping only explicit partial/interim chunks.
  return !isPartialTranscript(type);
};

const isAlreadyStartingOrStarted = (message: string | undefined): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already starting") ||
    normalized.includes("already started")
  );
};

const isNotStarted = (message: string | undefined): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("not started");
};

const getWebhookBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // VideoSDK webhook calls are server-to-server; localhost is not reachable.
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "";
    }
    return origin;
  }

  return "";
};

export default function useMeetingTranscription({
  roomId,
  meetingDbId,
}: UseMeetingTranscriptionArgs): UseMeetingTranscriptionResult {
  const meetingHook = useMeeting();
  const meeting = meetingHook?.meeting;
  const [hasTranscriptionControl, setHasTranscriptionControl] =
    useState<boolean>(false);
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<string>("IDLE");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isTranscriptionLive, setIsTranscriptionLive] =
    useState<boolean>(false);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<TranscriptionLogEntry[]>([]);
  const noTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchedTxtUrlRef = useRef<string | null>(null);
  const recentEventKeysRef = useRef<Map<string, number>>(new Map());
  const localNoTextWarningRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const localNoTextWarningShownRef = useRef<boolean>(false);
  const localParticipantIdRef = useRef<string | null>(null);
  const storageKey = useMemo(
    () => `meeting-transcription-state:${roomId}`,
    [roomId],
  );

  const setStatusFromEvent = useCallback(
    (data: TranscriptionStateEvent) => {
      const nextStatus = normalizeStatus(data.status);
      setTranscriptionStatus(nextStatus);
      setErrorMessage(null);

      if (
        nextStatus === "TRANSCRIPTION_STARTED" ||
        nextStatus === "TRANSCRIPTION_STARTING"
      ) {
        if (data.id) {
          setActiveSessionId(data.id);
        }
        setIsTranscriptionLive(true);
      } else if (nextStatus === "TRANSCRIPTION_STOPPING") {
        setIsTranscriptionLive(false);
      } else if (nextStatus === "TRANSCRIPTION_STOPPED") {
        setIsTranscriptionLive(false);
        // Clear stale session id so fallback poll doesn't restart on old session.
        setActiveSessionId(null);
      }

      if (typeof window !== "undefined") {
        const sessionId =
          nextStatus === "TRANSCRIPTION_STOPPED" ? null : (data.id ?? null);
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            status: nextStatus,
            sessionId,
            updatedAt: Date.now(),
          }),
        );
      }

      console.log("[Transcription] state:", nextStatus, "session:", data.id);
    },
    [storageKey],
  );

  const addTranscriptEntry = useCallback(
    (data: TranscriptionTextEvent) => {
      const isFinal = isFinalTranscript(data.type);
      if (!isFinal) {
        return;
      }

      const dedupeKey = `${data.participantId}:${data.timestamp}:${data.type}:${data.text}`;
      const now = Date.now();

      for (const [key, ts] of recentEventKeysRef.current.entries()) {
        if (now - ts > DUPLICATE_EVENT_WINDOW_MS) {
          recentEventKeysRef.current.delete(key);
        }
      }

      if (recentEventKeysRef.current.has(dedupeKey)) {
        return;
      }
      recentEventKeysRef.current.set(dedupeKey, now);

      const localParticipantId = localParticipantIdRef.current;
      if (localParticipantId && data.participantId === localParticipantId) {
        if (localNoTextWarningRef.current) {
          clearTimeout(localNoTextWarningRef.current);
          localNoTextWarningRef.current = null;
        }
        localNoTextWarningShownRef.current = false;
      }

      const entry: TranscriptionLogEntry = {
        id: `${data.timestamp}-${data.participantId}-${Math.random().toString(36).slice(2, 8)}`,
        participantId: data.participantId,
        participantName: data.participantName || "Unknown speaker",
        text: data.text,
        timestamp: data.timestamp,
        type: data.type,
        isFinal,
      };

      console.log(
        "[Transcription] text:",
        `${entry.participantName}: ${entry.text}`,
        "type:",
        entry.type,
        "raw:",
        data,
      );

      if (noTextTimeoutRef.current) {
        clearTimeout(noTextTimeoutRef.current);
        noTextTimeoutRef.current = null;
      }

      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_TRANSCRIPT_ENTRIES
          ? next.slice(next.length - MAX_TRANSCRIPT_ENTRIES)
          : next;
      });

      void saveTranscriptSegment(
        meetingDbId,
        entry.participantName,
        entry.text,
        new Date(entry.timestamp).toISOString(),
      ).then((result) => {
        if (!result.success) {
          console.warn(
            "[Transcription] failed to persist transcript segment:",
            result.error,
          );
        }
      });
    },
    [meetingDbId],
  );

  const { startTranscription, stopTranscription } = useTranscription({
    onTranscriptionStateChanged: setStatusFromEvent,
    onTranscriptionText: addTranscriptEntry,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        status?: string;
        sessionId?: string | null;
        updatedAt?: number;
      };

      if (!parsed || !parsed.status) return;

      if (parsed.sessionId) {
        setActiveSessionId(parsed.sessionId);
      }

      const restoredStatus = normalizeStatus(parsed.status);
      setTranscriptionStatus(restoredStatus);
      if (
        restoredStatus === "TRANSCRIPTION_STARTED" ||
        restoredStatus === "TRANSCRIPTION_STARTING"
      ) {
        setIsTranscriptionLive(true);
      }
    } catch {
      // Ignore broken session storage entries.
    }
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;

    const hydrateTranscriptHistory = async () => {
      if (!meetingDbId || isMeetingDebug()) {
        return;
      }

      const result = await getMeetingTranscripts(meetingDbId);
      if (cancelled) {
        return;
      }

      if (!result.success) {
        if (!cancelled) {
          console.warn(
            "[Transcription] failed to load transcript history:",
            result.error,
          );
        }
        return;
      }

      const transcriptSegments = result.data ?? [];

      const mappedLogs: TranscriptionLogEntry[] = transcriptSegments.map(
        (segment) => ({
          id: segment.id,
          participantId: segment.participantName,
          participantName: segment.participantName,
          text: segment.text,
          timestamp: new Date(segment.spokenAt).getTime(),
          type: "final",
          isFinal: true,
        }),
      );

      setLogs(
        mappedLogs.length > MAX_TRANSCRIPT_ENTRIES
          ? mappedLogs.slice(mappedLogs.length - MAX_TRANSCRIPT_ENTRIES)
          : mappedLogs,
      );
    };

    void hydrateTranscriptHistory();

    return () => {
      cancelled = true;
    };
  }, [meetingDbId]);

  useEffect(() => {
    if (!meeting || isMeetingDebug()) return;

    localParticipantIdRef.current = meetingHook?.localParticipant?.id ?? null;

    const handleMeetingLeft = () => {
      setIsTranscriptionLive(false);
      setIsActionPending(false);
      setTranscriptionStatus("IDLE");
      setErrorMessage(null);
    };

    const handleError = (error: { code?: number; message?: string }) => {
      console.error("[Transcription] meeting error:", error);
      if (isAlreadyStartingOrStarted(error?.message)) {
        // Rejoin path: transcription is already active in the room.
        setTranscriptionStatus("TRANSCRIPTION_STARTING");
        setIsTranscriptionLive(true);
        setErrorMessage(null);
        return;
      }

      if (isNotStarted(error?.message)) {
        // Backend says nothing is active anymore; sync local state to stopped.
        setTranscriptionStatus("TRANSCRIPTION_STOPPED");
        setIsTranscriptionLive(false);
        setActiveSessionId(null);
        if (noTextTimeoutRef.current) {
          clearTimeout(noTextTimeoutRef.current);
          noTextTimeoutRef.current = null;
        }
        setErrorMessage(null);
        return;
      }

      if (error?.message) {
        setErrorMessage(error.message);
      } else if (typeof error?.code === "number") {
        setErrorMessage(`VideoSDK error code: ${error.code}`);
      }
    };

    const handleSpeakerChanged = (activeSpeakerId: string | null) => {
      console.log("[Transcription] active speaker changed:", activeSpeakerId);

      const localParticipantId = localParticipantIdRef.current;
      if (!localParticipantId || activeSpeakerId !== localParticipantId) {
        return;
      }

      if (localNoTextWarningRef.current) {
        clearTimeout(localNoTextWarningRef.current);
      }

      localNoTextWarningRef.current = setTimeout(() => {
        if (localNoTextWarningShownRef.current) {
          return;
        }

        localNoTextWarningShownRef.current = true;
        setErrorMessage(
          "Local participant is detected as active speaker, but local transcription text is not emitted. Remote participants may still receive your transcript depending on SDK behavior.",
        );
        console.warn(
          "[Transcription] Local speaker detected without local text events. This may be expected if SDK does not emit self-transcript to same client.",
        );
      }, 4000);
    };

    meeting.on("meeting-left", handleMeetingLeft);
    meeting.on("error", handleError);
    meeting.on("speaker-changed", handleSpeakerChanged);
    console.log("[Transcription] direct meeting listeners attached");

    return () => {
      meeting.off("meeting-left", handleMeetingLeft);
      meeting.off("error", handleError);
      meeting.off("speaker-changed", handleSpeakerChanged);
      if (localNoTextWarningRef.current) {
        clearTimeout(localNoTextWarningRef.current);
        localNoTextWarningRef.current = null;
      }
      localNoTextWarningShownRef.current = false;
      console.log("[Transcription] direct meeting listeners detached");
    };
  }, [meeting, meetingHook?.localParticipant?.id]);

  useEffect(() => {
    if (
      !roomId ||
      !activeSessionId ||
      !isTranscriptionLive ||
      !hasTranscriptionControl ||
      isMeetingDebug()
    ) {
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
        fallbackPollRef.current = null;
      }
      return;
    }

    if (fallbackPollRef.current) {
      clearInterval(fallbackPollRef.current);
      fallbackPollRef.current = null;
    }

    fallbackPollRef.current = setInterval(async () => {
      const result = await getTranscription(roomId, activeSessionId, 1, 1);
      if (!result.success) {
        console.warn("[Transcription] fallback poll failed:", result.error);
        return;
      }

      const latest = result.data?.transcriptions?.[0];
      if (!latest) {
        console.log(
          "[Transcription] fallback poll: no transcript chunks yet for session",
          activeSessionId,
        );
        return;
      }

      console.log("[Transcription] fallback poll latest chunk:", {
        id: latest.id,
        status: latest.status,
        start: latest.start,
        end: latest.end,
        hasTxt: Boolean(latest.transcriptionFilePaths?.txt),
      });

      if (latest.status === "failed") {
        console.warn(
          "[Transcription] session reported failed, syncing to stopped state",
        );
        setTranscriptionStatus("TRANSCRIPTION_STOPPED");
        setIsTranscriptionLive(false);
        setActiveSessionId(null);
        setErrorMessage(
          "Transcription session failed to start. Wait a moment, then try starting again.",
        );
        return;
      }

      const txtUrl = latest.transcriptionFilePaths?.txt;
      if (!txtUrl || txtUrl === lastFetchedTxtUrlRef.current) {
        return;
      }

      lastFetchedTxtUrlRef.current = txtUrl;
      const textResult = await fetchTranscriptionText(txtUrl);
      if (!textResult.success || !textResult.data?.trim()) {
        return;
      }

      addTranscriptEntry({
        participantId: "realtime-fallback",
        participantName: "Realtime Transcript",
        text: textResult.data,
        timestamp: Date.now(),
        type: "realtime",
      });
    }, REALTIME_FALLBACK_POLL_MS);

    console.log(
      "[Transcription] fallback polling started for session:",
      activeSessionId,
    );

    return () => {
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
        fallbackPollRef.current = null;
      }
      console.log(
        "[Transcription] fallback polling stopped for session:",
        activeSessionId,
      );
    };
  }, [
    activeSessionId,
    addTranscriptEntry,
    hasTranscriptionControl,
    isTranscriptionLive,
    roomId,
  ]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!roomId) {
        if (mounted) {
          setHasTranscriptionControl(false);
        }
        return;
      }

      if (isMeetingDebug()) {
        if (mounted) {
          setHasTranscriptionControl(true);
        }
        return;
      }

      const access = await getTranscriptionControlAccess(roomId);
      if (!mounted) return;

      if (!access.success) {
        setHasTranscriptionControl(false);
        setErrorMessage(
          access.error ?? "Failed to check transcription control access",
        );
        return;
      }

      setHasTranscriptionControl(Boolean(access.data?.canControl));
    };

    run();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  const startLiveTranscription = useCallback(async () => {
    if (!roomId || !meetingDbId) {
      setErrorMessage("Meeting context is not ready for transcription");
      return;
    }

    if (
      isActionPending ||
      isTranscriptionLive ||
      transcriptionStatus === "TRANSCRIPTION_STARTING" ||
      transcriptionStatus === "TRANSCRIPTION_STARTED"
    ) {
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);

    try {
      const webhookBaseUrl = getWebhookBaseUrl();
      const webhookUrl = webhookBaseUrl
        ? `${webhookBaseUrl}/api/transcript-webhook/${meetingDbId}/`
        : undefined;

      const participantsMap =
        meetingHook?.participants instanceof Map
          ? meetingHook.participants
          : new Map<string, MinimalParticipant>();

      const participantsList = Array.from(
        participantsMap.values(),
      ) as MinimalParticipant[];

      const participantAudioSnapshot = participantsList.map((participant) => ({
        id: participant.id,
        name: participant.displayName,
        micOn: Boolean(participant.micOn),
        mode: participant.mode ?? "unknown",
      }));

      const hasAnyPublishableMic = participantAudioSnapshot.some(
        (participant) =>
          participant.micOn && participant.mode === "SEND_AND_RECV",
      );

      console.log(
        "[Transcription] participant audio snapshot:",
        participantAudioSnapshot,
      );
      console.log(
        "[Transcription] activeSpeakerId before start:",
        meetingHook?.activeSpeakerId ?? null,
      );

      if (!hasAnyPublishableMic) {
        setErrorMessage(
          "No participant is publishing microphone audio (micOn + SEND_AND_RECV). Transcription may start but produce no text.",
        );
        console.warn(
          "[Transcription] No publishable mic tracks detected at start. Waiting for participant micOn in SEND_AND_RECV mode.",
        );
      }

      // Start realtime transcription from SDK so text events are emitted to this meeting context.
      startTranscription({
        webhookUrl,
        summary: {
          enabled: true,
          prompt: "Summarize the meeting highlights and action items.",
        },
      });

      setTranscriptionStatus("TRANSCRIPTION_STARTING");
      setIsTranscriptionLive(true);

      if (noTextTimeoutRef.current) {
        clearTimeout(noTextTimeoutRef.current);
      }
      noTextTimeoutRef.current = setTimeout(() => {
        setErrorMessage(
          "Transcription started but no text arrived in 15s. Check speaker mic state/language and meeting error logs.",
        );
        console.warn(
          "[Transcription] No text received within timeout after STARTING/STARTED.",
        );
      }, 15000);

      const participantsCount =
        meetingHook?.participants instanceof Map
          ? meetingHook.participants.size
          : 0;
      console.log(
        "[Transcription] start requested. room:",
        roomId,
        "participants:",
        participantsCount,
        "localMicOn:",
        meetingHook?.localMicOn,
      );
    } catch (error) {
      const caughtMessage = error instanceof Error ? error.message : undefined;
      if (isAlreadyStartingOrStarted(caughtMessage)) {
        // If backend says already starting, adopt active state instead of surfacing as failure.
        setTranscriptionStatus("TRANSCRIPTION_STARTING");
        setIsTranscriptionLive(true);
        setErrorMessage(null);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to start transcription";
      setErrorMessage(message);
      setIsTranscriptionLive(false);
      console.error("[Transcription] failed to start:", error);
    } finally {
      setIsActionPending(false);
    }
  }, [
    isActionPending,
    isTranscriptionLive,
    meetingDbId,
    roomId,
    startTranscription,
    transcriptionStatus,
  ]);

  const stopLiveTranscription = useCallback(async () => {
    if (!roomId) {
      setErrorMessage("Meeting context is not ready for transcription");
      return;
    }

    if (
      isActionPending ||
      !isTranscriptionLive ||
      transcriptionStatus === "TRANSCRIPTION_STARTING" ||
      transcriptionStatus === "TRANSCRIPTION_STOPPING"
    ) {
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);

    try {
      stopTranscription();
      setTranscriptionStatus("TRANSCRIPTION_STOPPING");
      // Keep live=true until STOPPED arrives to avoid start/stop race loops.
      if (noTextTimeoutRef.current) {
        clearTimeout(noTextTimeoutRef.current);
        noTextTimeoutRef.current = null;
      }
    } catch (error) {
      const caughtMessage = error instanceof Error ? error.message : undefined;
      if (isNotStarted(caughtMessage)) {
        setTranscriptionStatus("TRANSCRIPTION_STOPPED");
        setIsTranscriptionLive(false);
        setActiveSessionId(null);
        setErrorMessage(null);
        return;
      }

      const message =
        error instanceof Error ? error.message : "Failed to stop transcription";
      setErrorMessage(message);
      console.error("[Transcription] failed to stop:", error);
    } finally {
      setIsActionPending(false);
    }
  }, [
    isActionPending,
    isTranscriptionLive,
    roomId,
    stopTranscription,
    transcriptionStatus,
  ]);

  useEffect(() => {
    return () => {
      if (noTextTimeoutRef.current) {
        clearTimeout(noTextTimeoutRef.current);
        noTextTimeoutRef.current = null;
      }
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
        fallbackPollRef.current = null;
      }
      if (localNoTextWarningRef.current) {
        clearTimeout(localNoTextWarningRef.current);
        localNoTextWarningRef.current = null;
      }
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    hasTranscriptionControl,
    transcriptionStatus,
    activeSessionId,
    isTranscriptionLive,
    isActionPending,
    errorMessage,
    logs,
    startLiveTranscription,
    stopLiveTranscription,
    clearLogs,
  };
}
