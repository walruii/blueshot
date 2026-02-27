"use client";
import { isMeetingDebug } from "@/lib/debug";
import MeetingContent from "./MeetingContent";

interface MeetingContainerProps {
  meetingId: string;
  token: string;
  participantName: string;
  userId: string;
  meetingDbId: string;
}

/* MeetingContent logic moved to its own file */

export default function MeetingContainer({
  meetingId,
  token,
  participantName,
  userId,
  meetingDbId,
}: MeetingContainerProps) {
  if (isMeetingDebug()) {
    // render content directly when debugging, no SDK provider
    return (
      <MeetingContent
        participantName={participantName}
        meetingId={meetingId}
        userId={userId}
        meetingDbId={meetingDbId}
      />
    );
  }

  // require provider lazily to avoid SSR self-reference
  const { MeetingProvider } = require("@videosdk.live/react-sdk");

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
