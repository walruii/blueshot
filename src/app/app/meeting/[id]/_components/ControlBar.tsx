"use client";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  Sparkles,
  Menu,
  Captions,
  CaptionsOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recordParticipantLeave } from "@/server-actions/meeting";
import { isMeetingDebug } from "@/lib/debug";
import {
  getTranscription,
  getTranscriptionControlAccess,
  startTranscription,
  stopTranscription,
  fetchTranscriptionText,
} from "@/server-actions/meeting-transcriptions";
import { useAlert } from "@/components/AlertProvider";

import { useMeeting } from "@/lib/videosdkWrapper";

interface ControlBarProps {
  userId: string;
  roomId: string;
  meetingDbId: string;
  sidebarSetOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ControlBar({
  userId,
  roomId,
  meetingDbId,
  sidebarSetOpen,
}: ControlBarProps) {
  const { toggleMic, toggleWebcam, leave, localMicOn, localWebcamOn } =
    useMeeting();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [canControlTranscription, setCanControlTranscription] = useState(false);
  const [isStartingTranscription, setIsStartingTranscription] = useState(false);
  const [isStoppingTranscription, setIsStoppingTranscription] = useState(false);
  const [transcriptionRunning, setTranscriptionRunning] = useState(false);
  const [transcriptionSessionId, setTranscriptionSessionId] =
    useState<string>("");
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const loadControlAccess = async () => {
      if (!roomId || isMeetingDebug()) return;

      const result = await getTranscriptionControlAccess(roomId);
      if (!result.success) {
        console.error("Failed to check transcription access:", result.error);
        return;
      }

      setCanControlTranscription(Boolean(result.data?.canControl));
    };

    loadControlAccess();
  }, [roomId]);

  useEffect(() => {
    if (
      !canControlTranscription ||
      !transcriptionRunning ||
      !transcriptionSessionId
    ) {
      return;
    }

    const pollTranscriptions = async () => {
      const result = await getTranscription(
        roomId,
        transcriptionSessionId,
        1,
        20,
      );

      if (!result.success) {
        console.error("Polling transcription failed:", result.error);
        return;
      }

      console.log("Latest transcription payload:", result.data);

      // Extract CDN URL and fetch transcription text
      const transcriptions = result.data?.transcriptions;
      if (transcriptions && transcriptions.length > 0) {
        const cdnUrl = transcriptions[0]?.transcriptionFilePaths?.txt;
        if (cdnUrl) {
          console.log("Fetching transcription from CDN:", cdnUrl);
          const textResult = await fetchTranscriptionText(cdnUrl);
          if (textResult.success) {
            if (!textResult.data) console.warn("Transcription text is empty");
            else {
              setTranscriptionText(textResult.data);
              console.log("Transcription text fetched successfully");
            }
          } else {
            console.error(
              "Failed to fetch transcription text:",
              textResult.error,
            );
          }
        } else {
          console.log("No CDN URL available yet");
        }
      }
    };

    pollTranscriptions();
    const intervalId = window.setInterval(pollTranscriptions, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    canControlTranscription,
    roomId,
    transcriptionRunning,
    transcriptionSessionId,
  ]);

  const handleLeave = async () => {
    if (!isMeetingDebug() && meetingDbId) {
      // Record participant leave
      await recordParticipantLeave(meetingDbId, userId);
      router.push("/app"); // redirect only in non-debug
    }
    leave();
  };

  const handleToggleMic = async () => {
    toggleMic();
  };

  const handleToggleWebcam = async () => {
    toggleWebcam();
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    // TODO: Implement AI summarization API call
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Demo delay
    setIsSummarizing(false);
  };

  const handleStartTranscription = async () => {
    setIsStartingTranscription(true);
    const result = await startTranscription(roomId);
    setIsStartingTranscription(false);

    if (!result.success) {
      console.error("Start transcription failed:", result.error);
      showAlert({
        title: result.error,
        type: "error",
      });
      return;
    }

    const responseSessionId =
      result.data?.extension?.extensionConfig?.sessionId;

    if (!responseSessionId) {
      showAlert({
        title: "Failed to get session ID from transcription response",
        type: "error",
      });
      return;
    }

    setTranscriptionSessionId(responseSessionId);
    setTranscriptionRunning(true);
    console.log("Transcription started with session ID:", responseSessionId);
  };

  const handleStopTranscription = async () => {
    if (!transcriptionSessionId.trim()) {
      showAlert({
        title: "Session ID is required before stopping transcription",
        type: "error",
      });
      return;
    }

    setIsStoppingTranscription(true);
    const result = await stopTranscription(
      roomId,
      transcriptionSessionId.trim(),
    );
    setIsStoppingTranscription(false);

    if (!result.success) {
      console.error("Stop transcription failed:", result.error);
      showAlert({
        title: result.error,
        type: "error",
      });
      return;
    }

    setTranscriptionRunning(false);
    console.log("Transcription stopped:", result.data);
  };

  return (
    <>
      {/* Transcription Display */}
      {transcriptionText && (
        <div className="fixed bottom-32 left-4 right-4 md:left-1/4 md:right-1/4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto z-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Captions className="h-4 w-4" />
              Live Transcription
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTranscriptionText("")}
            >
              Hide
            </Button>
          </div>
          <div className="text-sm whitespace-pre-wrap text-muted-foreground">
            {transcriptionText}
          </div>
        </div>
      )}

      <div className="bg-background/80 backdrop-blur-sm border-t border-border z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* Mic Toggle */}
            <Button
              variant={localMicOn ? "default" : "destructive"}
              size="icon-lg"
              onClick={handleToggleMic}
              className="rounded-full"
              title={localMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {localMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant={localWebcamOn ? "default" : "destructive"}
              size="icon-lg"
              onClick={handleToggleWebcam}
              className="rounded-full"
              title={localWebcamOn ? "Turn off camera" : "Turn on camera"}
            >
              {localWebcamOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            {/* Summarize Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="gap-2"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Summarize
                </>
              )}
            </Button>

            {canControlTranscription && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleStartTranscription}
                  disabled={isStartingTranscription || transcriptionRunning}
                  className="gap-2"
                >
                  {isStartingTranscription ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Captions className="h-4 w-4" />
                      Start Transcription
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleStopTranscription}
                  disabled={isStoppingTranscription || !transcriptionRunning}
                  className="gap-2"
                >
                  {isStoppingTranscription ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <CaptionsOff className="h-4 w-4" />
                      Stop Transcription
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Leave Meeting */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeave}
              className="gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Leave
            </Button>
            <Button
              variant="secondary"
              size="icon-lg"
              onClick={() => sidebarSetOpen && sidebarSetOpen((prev) => !prev)}
              className="rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
