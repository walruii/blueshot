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
  const { enableWebcam, unmuteMic, leave } = useMeeting();

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

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          <VideoGrid meetingId={meetingId} />
        </div>
        <div
          className="flex flex-col w-80 h-full min-h-0 border-l border-neutral-800 bg-card"
          hidden={!isOpen}
        >
          <IntegratedSidebar meetingDbId={meetingDbId} />
        </div>
      </div>
      <div className="border-t border-neutral-800 bg-neutral-950 shrink-0">
        <ControlBar
          userId={userId}
          roomId={meetingId}
          meetingDbId={meetingDbId}
          sidebarSetOpen={setIsOpen}
        />
      </div>
    </div>
  );
}
