"use client";
import { useMeeting } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  recordMeetingEvent,
  recordParticipantLeave,
  getMeetingByVideoSdkId,
} from "@/server-actions/meeting";

interface ControlBarProps {
  meetingId: string;
  userId: string;
}

export default function ControlBar({ meetingId, userId }: ControlBarProps) {
  const {
    toggleMic,
    toggleWebcam,
    leave,
    localMicOn,
    localWebcamOn,
    meetingId: videoSdkMeetingId,
  } = useMeeting();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [meetingDbId, setMeetingDbId] = useState<string | null>(null);
  const router = useRouter();

  // Get meeting DB ID on mount
  useEffect(() => {
    const fetchMeetingDbId = async () => {
      const result = await getMeetingByVideoSdkId(meetingId);
      if (result.success && result.data) {
        setMeetingDbId(result.data.id);
      }
    };
    fetchMeetingDbId();
  }, [meetingId]);

  const handleLeave = async () => {
    if (meetingDbId) {
      // Record participant leave
      await recordParticipantLeave(meetingDbId, userId);
      // Record leave event
      await recordMeetingEvent(meetingDbId, userId, "leave");
    }
    leave();
    router.push("/app"); // Redirect to app home after leaving
  };

  const handleToggleMic = async () => {
    toggleMic();
    if (meetingDbId) {
      // Record event after toggle (state will flip)
      await recordMeetingEvent(
        meetingDbId,
        userId,
        localMicOn ? "mic_off" : "mic_on",
      );
    }
  };

  const handleToggleWebcam = async () => {
    toggleWebcam();
    if (meetingDbId) {
      // Record event after toggle (state will flip)
      await recordMeetingEvent(
        meetingDbId,
        userId,
        localWebcamOn ? "camera_off" : "camera_on",
      );
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    // TODO: Implement AI summarization API call
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Demo delay
    setIsSummarizing(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm border-t border-border z-30">
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
        </div>
      </div>
    </div>
  );
}
