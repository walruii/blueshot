"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { TranscriptionLogEntry } from "../_hooks/useMeetingTranscription";

interface TranscriptTabProps {
  hasTranscriptionControl: boolean;
  isTranscriptionLive: boolean;
  isActionPending: boolean;
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
  errorMessage,
  logs,
  startLiveTranscription,
  stopLiveTranscription,
  clearLogs,
}: TranscriptTabProps) {
  return (
    <div className="p-4 h-full flex flex-col min-h-0 gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Transcript</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
            isTranscriptionLive
              ? "bg-green-500/15 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isTranscriptionLive ? "bg-green-500" : "bg-muted-foreground"
            }`}
          />
          {isTranscriptionLive ? "Live" : "Stopped"}
        </span>
      </div>

      <div className="space-y-2">
        {errorMessage && (
          <p className="text-xs text-red-400">Error: {errorMessage}</p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void startLiveTranscription()}
          disabled={
            !hasTranscriptionControl || isActionPending || isTranscriptionLive
          }
        >
          Start Transcription
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => void stopLiveTranscription()}
          disabled={
            !hasTranscriptionControl || isActionPending || !isTranscriptionLive
          }
        >
          Stop Transcription
        </Button>
        <Button size="sm" variant="ghost" onClick={clearLogs}>
          Clear
        </Button>
      </div>

      <ScrollArea className="h-full rounded-md border border-border p-3">
        <div className="space-y-3 w-full">
          {logs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No transcript yet. Start transcription to capture the
              conversation.
            </p>
          )}

          {logs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {log.participantName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm p-2 rounded bg-muted text-foreground">
                {log.text}
              </p>
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
