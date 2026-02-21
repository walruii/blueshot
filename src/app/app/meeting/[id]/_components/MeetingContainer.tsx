"use client";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import { useState, useEffect } from "react";
import VideoGrid from "./VideoGrid";
import ControlBar from "./ControlBar";
import IntegratedSidebar from "./IntegratedSidebar";
import PreJoinScreen from "./PreJoinScreen";
import {
  recordParticipantLeave,
  getMeetingByVideoSdkId,
} from "@/server-actions/meeting";

interface MeetingContainerProps {
  meetingId: string;
  token: string;
  participantName: string;
  userId: string;
}

function MeetingContent({
  participantName,
  meetingId,
  userId,
}: {
  participantName: string;
  meetingId: string;
  userId: string;
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
        meetingId={meetingId}
        userId={userId}
        onJoin={(settings) => {
          setDeviceSettings(settings);
          setHasJoined(true);
        }}
      />
    );
  }

  return (
    <MeetingContentWithDevices
      deviceSettings={deviceSettings}
      meetingId={meetingId}
      userId={userId}
    />
  );
}

function MeetingContentWithDevices({
  deviceSettings,
  meetingId,
  userId,
}: {
  deviceSettings: { cameraOn: boolean; micOn: boolean };
  meetingId: string;
  userId: string;
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
        const result = await getMeetingByVideoSdkId(meetingId);
        if (result.success && result.data) {
          await recordParticipantLeave(result.data.id, userId);
        }
      };
      cleanup();
    };
  }, [meetingId, userId]);

  return (
    <>
      <div className="flex h-screen bg-black">
        {/* Video grid with participant tiles */}
        <div className="flex-1 pb-24">
          <VideoGrid meetingId={meetingId} />
        </div>

        {/* Integrated Sidebar */}
        <IntegratedSidebar />
      </div>

      {/* Control Bar */}
      <ControlBar meetingId={meetingId} userId={userId} />
    </>
  );
}

export default function MeetingContainer({
  meetingId,
  token,
  participantName,
  userId,
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
      />
    </MeetingProvider>
  );
}
