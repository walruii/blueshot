"use client";
import { useState } from "react";
import PreJoinScreen from "./PreJoinScreen";
import MeetingContentWithDevices from "./MeetingContentWithDevices";

interface MeetingContentProps {
  participantName: string;
  meetingId: string;
  userId: string;
  meetingDbId: string;
}

export default function MeetingContent({
  participantName,
  meetingId,
  userId,
  meetingDbId,
}: MeetingContentProps) {
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
