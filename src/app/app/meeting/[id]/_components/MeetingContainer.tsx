"use client";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import { useState, useEffect } from "react";
import VideoGrid from "./VideoGrid";
import ControlBar from "./ControlBar";
import IntegratedSidebar from "./IntegratedSidebar";
import PreJoinScreen from "./PreJoinScreen";

interface MeetingContainerProps {
  meetingId: string;
  token: string;
  participantName: string;
}

function MeetingContent({ participantName }: { participantName: string }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [deviceSettings, setDeviceSettings] = useState({
    cameraOn: true,
    micOn: false,
  });

  if (!hasJoined) {
    return (
      <PreJoinScreen
        participantName={participantName}
        onJoin={(settings) => {
          setDeviceSettings(settings);
          setHasJoined(true);
        }}
      />
    );
  }

  return <MeetingContentWithDevices deviceSettings={deviceSettings} />;
}

function MeetingContentWithDevices({
  deviceSettings,
}: {
  deviceSettings: { cameraOn: boolean; micOn: boolean };
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

  return (
    <>
      <div className="flex h-screen bg-black">
        {/* Video grid with participant tiles */}
        <div className="flex-1 pb-24">
          <VideoGrid />
        </div>

        {/* Integrated Sidebar */}
        <IntegratedSidebar />
      </div>

      {/* Control Bar */}
      <ControlBar />
    </>
  );
}

export default function MeetingContainer({
  meetingId,
  token,
  participantName,
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
      <MeetingContent participantName={participantName} />
    </MeetingProvider>
  );
}
