"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Captions, CaptionsOff, Loader2 } from "lucide-react";

export default function TranscriptTab({
  canControlTranscription,
  transcriptionRecording,
  transcriptionLive,
  startRecordingTranscription,
  stopRecordingTranscription,
  startLiveTranscription,
  stopLiveTranscription,
  transcriptionRecordLoading,
  transcriptionLiveLoading,
}: {
  canControlTranscription: boolean;
  transcriptionRecording: boolean;
  transcriptionLive: boolean;
  startRecordingTranscription: () => Promise<void>;
  stopRecordingTranscription: () => Promise<void>;
  startLiveTranscription: () => Promise<void>;
  stopLiveTranscription: () => Promise<void>;
  transcriptionRecordLoading: boolean;
  transcriptionLiveLoading: boolean;
}) {
  return (
    <>
      <ScrollArea className="h-full p-4">
        <h3 className="font-bold pb-5">Transcript</h3>
        <div className="flex flex-col gap-3">
          {canControlTranscription && (
            <Button
              variant="secondary"
              size="lg"
              onClick={
                transcriptionRecording
                  ? stopRecordingTranscription
                  : startRecordingTranscription
              }
              disabled={transcriptionRecordLoading}
              className="w-full gap-2"
            >
              {transcriptionRecordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {transcriptionRecording ? "Stopping..." : "Starting..."}
                </>
              ) : transcriptionRecording ? (
                <>
                  <CaptionsOff className="h-4 w-4" />
                  Stop Recording Transcription
                </>
              ) : (
                <>
                  <Captions className="h-4 w-4" />
                  Start Recording Transcription
                </>
              )}
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={
              transcriptionLive ? stopLiveTranscription : startLiveTranscription
            }
            disabled={transcriptionLiveLoading}
            className="w-full gap-2"
          >
            {transcriptionLiveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {transcriptionLive ? "Stopping..." : "Starting..."}
              </>
            ) : transcriptionLive ? (
              <>
                <CaptionsOff className="h-4 w-4" />
                Stop Live Transcription
              </>
            ) : (
              <>
                <Captions className="h-4 w-4" />
                Start Live Transcription
              </>
            )}
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}
