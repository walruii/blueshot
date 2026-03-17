"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranscriptionLogEntry } from "../_hooks/useMeetingTranscription";

interface TranscriptTabProps {
  hasTranscriptionControl: boolean;
  isTranscriptionLive: boolean;
  isActionPending: boolean;
  transcriptionStatus: string;
  activeSessionId: string | null;
  errorMessage: string | null;
  logs: TranscriptionLogEntry[];
  startLiveTranscription: () => Promise<void>;
  stopLiveTranscription: () => Promise<void>;
  clearLogs: () => void;
}

export default function TranscriptTab({
  hasTranscriptionControl,
  isTranscriptionLive,
  isActionPending,
  transcriptionStatus,
  activeSessionId,
  errorMessage,
  logs,
  startLiveTranscription,
  stopLiveTranscription,
  clearLogs,
}: TranscriptTabProps) {
  return (
    <div className="p-4 h-full flex flex-col min-h-0 gap-3">
      <div className="space-y-2">
        <h3 className="font-bold">Transcript</h3>
        <p className="text-xs text-muted-foreground">
          Status:{" "}
          <span className="font-medium text-foreground">
            {transcriptionStatus}
          </span>
        </p>
        {activeSessionId && (
          <p className="text-xs text-muted-foreground break-all">
            Session: {activeSessionId}
          </p>
        )}
        {errorMessage && (
          <p className="text-xs text-red-400">Error: {errorMessage}</p>
        )}
        {transcriptionStatus === "TRANSCRIPTION_STARTING" &&
          !activeSessionId && (
            <p className="text-xs text-amber-400">
              Start requested but no session id yet. Check meeting error events
              for permission/token issues.
            </p>
          )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => void startLiveTranscription()}
          disabled={
            !hasTranscriptionControl || isActionPending || isTranscriptionLive
          }
          className="px-3 py-2 bg-green-600 disabled:bg-green-900/60 disabled:text-green-200/60 hover:bg-green-700 text-white font-bold rounded transition-all text-xs"
        >
          Start Transcription
        </button>
        <button
          onClick={() => void stopLiveTranscription()}
          disabled={
            !hasTranscriptionControl || isActionPending || !isTranscriptionLive
          }
          className="px-3 py-2 bg-red-600 disabled:bg-red-900/60 disabled:text-red-200/60 hover:bg-red-700 text-white font-bold rounded transition-all text-xs"
        >
          Stop Transcription
        </button>
        <button
          onClick={clearLogs}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs"
        >
          Clear Logs
        </button>
      </div>

      <ScrollArea className="h-full rounded-md border border-border bg-black/90 p-3">
        <div className="flex flex-col gap-2 font-mono text-xs text-green-400">
          {logs.length === 0 && (
            <p className="text-gray-500 italic">
              No transcription events yet. Start transcription to begin.
            </p>
          )}

          {logs.map((log) => (
            <div key={log.id} className="border-b border-gray-800 pb-1">
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              <span className="text-blue-300 font-bold">
                {log.participantName}:
              </span>{" "}
              <span
                className={
                  log.isFinal ? "text-green-400" : "text-gray-300 italic"
                }
              >
                {log.text}
              </span>
              {!log.isFinal && (
                <span className="text-[10px] ml-2 text-orange-400">
                  (Partial)
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {!hasTranscriptionControl && (
        <p className="text-xs text-muted-foreground">
          You do not have permission to start or stop transcription, but live
          text remains visible.
        </p>
      )}
    </div>
  );
}
