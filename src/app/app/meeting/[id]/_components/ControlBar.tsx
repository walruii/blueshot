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
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordParticipantLeave } from "@/server-actions/meeting";
import { isMeetingDebug } from "@/lib/debug";

import { useMeeting } from "@/lib/videosdkWrapper";

interface ControlBarProps {
  userId: string;
  meetingDbId: string;
  sidebarSetOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ControlBar({
  userId,
  meetingDbId,
  sidebarSetOpen,
}: ControlBarProps) {
  const { toggleMic, toggleWebcam, leave, localMicOn, localWebcamOn } =
    useMeeting();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const router = useRouter();

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

  return (
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
  );
}
