"use client";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantView from "./ParticipantView";
import { Users } from "lucide-react";

export default function VideoGrid() {
  const { participants } = useMeeting();

  // Convert participants Map to array
  const participantIds = Array.from(participants.keys());

  if (participantIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No participants yet</h3>
          <p className="text-sm">Waiting for others to join...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {participantIds.map((participantId) => (
          <ParticipantView key={participantId} participantId={participantId} />
        ))}
      </div>
    </div>
  );
}
