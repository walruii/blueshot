"use client";
import { useEffect, useState } from "react";
import { isMeetingDebug } from "@/lib/debug";
import { useMeeting } from "@/lib/videosdkWrapper";
import VideoGrid from "./VideoGrid";
import IntegratedSidebar from "./IntegratedSidebar";
import ControlBar from "./ControlBar";
import {
  getMeetingByRoomId,
  recordParticipantLeave,
} from "@/server-actions/meeting";
import useTranscriptions from "../_hooks/use-transcriptions";
import { Captions } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MeetingContentWithDevicesProps {
  deviceSettings: { cameraOn: boolean; micOn: boolean };
  meetingId: string;
  userId: string;
  meetingDbId: string;
}

export default function MeetingContentWithDevices({
  deviceSettings,
  meetingId,
  userId,
  meetingDbId,
}: MeetingContentWithDevicesProps) {
  const { enableWebcam, unmuteMic } = useMeeting();
  const {
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
  } = useTranscriptions({ roomId: meetingDbId });

  // Enable devices after joining based on prejoin settings
  useEffect(() => {
    if (isMeetingDebug()) return;
    if (deviceSettings.cameraOn) {
      enableWebcam();
    }
    if (deviceSettings.micOn) {
      unmuteMic();
    }
  }, []); // Run once after mount

  // Cleanup on unmount - ensure participant leave is recorded
  useEffect(() => {
    return () => {
      if (isMeetingDebug()) return;
      const cleanup = async () => {
        const result = await getMeetingByRoomId(meetingId);
        if (result.success && result.data) {
          await recordParticipantLeave(result.data.id, userId);
        }
      };
      cleanup();
    };
  }, [meetingId, userId]);

  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

  return (
    <>
      {/* Transcription Display */}
      {isTranscriptionLive && (
        <div className="fixed bottom-32 left-4 right-4 md:left-1/4 md:right-1/4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto z-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Captions className="h-4 w-4" />
              Live Transcription
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTranscriptionLive(false)}
            >
              Hide
            </Button>
          </div>
          <div className="text-sm whitespace-pre-wrap text-muted-foreground">
            {transcriptionText}
          </div>
        </div>
      )}
      <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`flex-1 overflow-hidden relative
          ${sidebarIsOpen ? "hidden sm:flex" : "w-full"}`}
          >
            <VideoGrid meetingId={meetingId} />
          </div>
          <div
            className="flex flex-col w-full sm:w-80 h-full min-h-0 border-l border-neutral-800 bg-card"
            hidden={!sidebarIsOpen}
          >
            <IntegratedSidebar
              meetingDbId={meetingDbId}
              roomId={meetingId}
              canControlTranscription={hasTranscriptionControl}
              transcriptionRecording={isTranscriptionRecording}
              setTranscriptionRecording={setIsTranscriptionRecording}
              transcriptionLive={isTranscriptionLive}
              setTranscriptionLive={setIsTranscriptionLive}
              startRecordingTranscription={startRecordingTranscription}
              stopRecordingTranscription={stopRecordingTranscription}
              startLiveTranscription={startLiveTranscription}
              stopLiveTranscription={stopLiveTranscription}
              transcriptionRecordLoading={isTranscriptionRecording}
              transcriptionLiveLoading={isTranscriptionLive}
            />
          </div>
        </div>
        <div className="border-t border-neutral-800 bg-neutral-950 shrink-0">
          <ControlBar
            userId={userId}
            roomId={meetingId}
            meetingDbId={meetingDbId}
            sidebarSetOpen={setSidebarIsOpen}
          />
        </div>
      </div>
    </>
  );
}
