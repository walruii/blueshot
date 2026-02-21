"use client";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoGrid from "./VideoGrid";
import ControlBar from "./ControlBar";
import IntegratedSidebar from "./IntegratedSidebar";

interface MeetingContainerProps {
  meetingId: string;
  token: string;
  participantName: string;
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
    </MeetingProvider>
  );
}
