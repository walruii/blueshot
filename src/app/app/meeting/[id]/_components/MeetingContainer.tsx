"use client";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import { useState, useEffect } from "react";
import VideoGrid from "./VideoGrid";
import ControlBar from "./ControlBar";
import IntegratedSidebar from "./IntegratedSidebar";
import PreJoinScreen from "./PreJoinScreen";
import {
  getMeetingByRoomId,
  recordParticipantLeave,
} from "@/server-actions/meeting";

interface MeetingContainerProps {
  meetingId: string;
  token: string;
  participantName: string;
  userId: string;
  meetingDbId: string;
}

function MeetingContent({
  participantName,
  meetingId,
  userId,
  meetingDbId,
}: {
  participantName: string;
  meetingId: string;
  userId: string;
  meetingDbId: string;
}) {
  const [hasJoined, setHasJoined] = useState(false);
  const [deviceSettings, setDeviceSettings] = useState({
    cameraOn: true,
    micOn: false,
  });

  if (!hasJoined) {
    return (
      <PreJoinScreen
        participantName={participantName}
        userId={userId}
        onJoin={(settings) => {
          setDeviceSettings(settings);
          setHasJoined(true);
        }}
        meetingDbId={meetingDbId}
      />
    );
  }

  return (
    <MeetingContentWithDevices
      deviceSettings={deviceSettings}
      meetingId={meetingId}
      userId={userId}
      meetingDbId={meetingDbId}
    />
  );
}

export function MeetingContentWithDevices({
  deviceSettings,
  meetingId,
  userId,
  meetingDbId,
}: {
  deviceSettings: { cameraOn: boolean; micOn: boolean };
  meetingId: string;
  userId: string;
  meetingDbId: string;
}) {
  const { enableWebcam, unmuteMic } = useMeeting();

  // Enable devices after joining based on prejoin settings
  useEffect(() => {
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
      // Cleanup when component unmounts (user navigates away or closes tab)
      const cleanup = async () => {
        const result = await getMeetingByRoomId(meetingId);
        if (result.success && result.data) {
          await recordParticipantLeave(result.data.id, userId);
        }
      };
      cleanup();
    };
  }, [meetingId, userId]);

  return (
    <div className="grid grid-rows-[1fr,auto] h-dvh bg-black text-white overflow-hidden">
      {/* Main Content Area (Video + Sidebar) */}
      <div className="flex overflow-hidden">
        {/* Video grid with participant tiles - flex-1 takes remaining space */}
        <div className="flex-1 overflow-hidden relative">
          <VideoGrid meetingId={meetingId} />
        </div>

        {/* Integrated Sidebar */}
        <div className="w-80 border-l border-neutral-800 flex flex-col overflow-hidden">
          <IntegratedSidebar meetingDbId={meetingDbId} />
        </div>
      </div>

      {/* Control Bar - pinned to bottom */}
      <div className="h-20 border-t border-neutral-800 bg-neutral-950">
        <ControlBar userId={userId} meetingDbId={meetingDbId} />
      </div>
    </div>
  );
}

export default function MeetingContainer({
  meetingId,
  token,
  participantName,
  userId,
  meetingDbId,
}: MeetingContainerProps) {
  return (
    <MeetingProvider
      config={{
        meetingId: meetingId,
        micEnabled: false,
        webcamEnabled: false,
        name: participantName,
        debugMode: true,
      }}
      token={token}
    >
      <MeetingContent
        participantName={participantName}
        meetingId={meetingId}
        userId={userId}
        meetingDbId={meetingDbId}
      />
    </MeetingProvider>
  );
}
