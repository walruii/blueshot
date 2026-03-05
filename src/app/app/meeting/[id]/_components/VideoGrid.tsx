"use client";
import { useEffect, useRef } from "react";
import ParticipantView from "./ParticipantView";
import { Users } from "lucide-react";
import {
  addParticipant,
  getMeetingByRoomId,
  recordParticipantLeave,
} from "@/server-actions/meeting";
import { isMeetingDebug } from "@/lib/debug";

import { useMeeting } from "@/lib/videosdkWrapper";

interface VideoGridProps {
  meetingId: string;
}

export default function VideoGrid({ meetingId }: VideoGridProps) {
  const meetingHook = useMeeting();
  const participants = meetingHook?.participants ?? new Map();
  const meeting = meetingHook?.meeting;
  const meetingDbIdRef = useRef<string | null>(null);

  // provide mock participants map when debugging if none exist
  if (isMeetingDebug() && participants.size === 0) {
    participants.set("user-1", { id: "user-1", displayName: "Alice" });
    participants.set("user-2", { id: "user-2", displayName: "Bob" });
  }

  // Get meeting DB ID on mount
  useEffect(() => {
    if (isMeetingDebug()) return; // skip network in debug
    const fetchMeetingDbId = async () => {
      const result = await getMeetingByRoomId(meetingId);
      if (result.success && result.data) {
        meetingDbIdRef.current = result.data.id;
      }
    };
    fetchMeetingDbId();
  }, [meetingId]);

  // Track participant join/leave events
  useEffect(() => {
    if (!meeting || isMeetingDebug()) return;

    const handleParticipantJoined = async (participant: any) => {
      if (!meetingDbIdRef.current) return;

      // Add participant to database
      await addParticipant(
        meetingDbIdRef.current,
        participant.id,
        participant.micOn || false,
        participant.webcamOn || false,
      );

      // TODO:  Record join event
    };

    const handleParticipantLeft = async (participant: any) => {
      if (!meetingDbIdRef.current) return;

      // Record participant leave
      await recordParticipantLeave(meetingDbIdRef.current, participant.id);

      // TODO:  Record leave event
    };

    // Subscribe to meeting participant events
    meeting.on("participant-joined", handleParticipantJoined);
    meeting.on("participant-left", handleParticipantLeft);

    // Cleanup subscriptions
    return () => {
      meeting.off("participant-joined", handleParticipantJoined);
      meeting.off("participant-left", handleParticipantLeft);
    };
  }, [meeting, meetingId]);

  // Convert participants Map to array
  const participantIds = Array.from(participants.keys()) as string[];

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
