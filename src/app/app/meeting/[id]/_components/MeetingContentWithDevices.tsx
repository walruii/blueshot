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
import useMeetingTranscription from "../_hooks/useMeetingTranscription";

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
  const transcription = useMeetingTranscription({
    roomId: meetingId,
    meetingDbId,
  });

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
              transcription={transcription}
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
