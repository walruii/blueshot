"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMeetingDebug } from "@/lib/debug";
import { getTranscriptionControlAccess } from "@/server-actions/meeting-transcriptions";
import { useTranscription } from "@videosdk.live/react-sdk";
import { Captions, CaptionsOff, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function TranscriptTab({
  meetingDbId,
  roomId,
  canControlTranscription,
  transcriptionRecording,
  setTranscriptionRecording,
  transcriptionLive,
  setTranscriptionLive,
  startRecordingTranscription,
  stopRecordingTranscription,
  startLiveTranscription,
  stopLiveTranscription,
  transcriptionRecordLoading,
  transcriptionLiveLoading,
}: {
  meetingDbId: string;
  roomId: string;
  canControlTranscription: boolean;
  transcriptionRecording: boolean;
  setTranscriptionRecording: React.Dispatch<React.SetStateAction<boolean>>;
  transcriptionLive: boolean;
  setTranscriptionLive: React.Dispatch<React.SetStateAction<boolean>>;
  startRecordingTranscription: () => Promise<void>;
  stopRecordingTranscription: () => Promise<void>;
  startLiveTranscription: () => Promise<void>;
  stopLiveTranscription: () => Promise<void>;
  transcriptionRecordLoading: boolean;
  transcriptionLiveLoading: boolean;
}) {
  const [logs, setLogs] = useState<string[]>([]);

  const { startTranscription, stopTranscription } = useTranscription({
    // Triggered when transcription status changes (STARTING, STARTED, etc.)
    onTranscriptionStateChanged: (data) => {
      const { status, id } = data;
      console.log("Transcription Status: ", status);
    },
    // Triggered whenever someone speaks
    onTranscriptionText: (data) => {
      const { participantName, text, timestamp } = data;
      setLogs((prev) => [...prev, `${participantName}: ${text}`]);
    },
  });

  const handleStart = () => {
    const webhookBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const config = {
      // Optional: URL to receive a notification when transcription is ready
      webhookUrl: `${webhookBaseUrl}/api/transcript-webhook/${meetingDbId}/`,
      summary: {
        enabled: true, // Enable AI Summary
        prompt: "Summarize the meeting highlights and action items.",
      },
    };
    startTranscription(config);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">Live Transcript</h2>
      <div className="flex gap-2 my-4">
        <button
          onClick={handleStart}
          className="bg-green-500 text-white p-2 rounded"
        >
          Start Transcribing
        </button>
        <button
          onClick={() => stopTranscription()}
          className="bg-red-500 text-white p-2 rounded"
        >
          Stop
        </button>
      </div>

      <div className="h-64 overflow-y-auto bg-gray-100 p-2">
        {logs.map((log, index) => (
          <p key={index} className="text-sm mb-1">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
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
              disabled={
                transcriptionRecordLoading ||
                (transcriptionRecording
                  ? !transcriptionRecording
                  : transcriptionRecording)
              }
              className="w-full gap-2"
            >
              {transcriptionRecordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {transcriptionRecording ? "Stopping..." : "Starting..."}
                </>
              ) : (
                <>
                  {transcriptionRecording ? (
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
                </>
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            size="lg"
            onClick={
              transcriptionLiveLoading
                ? stopLiveTranscription
                : startLiveTranscription
            }
            disabled={
              transcriptionLiveLoading ||
              (transcriptionLiveLoading
                ? !transcriptionLive
                : transcriptionLive)
            }
            className="w-full gap-2"
          >
            {transcriptionLiveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {transcriptionLive ? "Stopping..." : "Starting..."}
              </>
            ) : (
              <>
                {transcriptionLive ? (
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
              </>
            )}
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}
