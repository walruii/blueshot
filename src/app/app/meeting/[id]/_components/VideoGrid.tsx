"use client";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantView from "./ParticipantView";
import { Users } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  addParticipant,
  recordMeetingEvent,
  recordParticipantLeave,
  getMeetingByVideoSdkId,
} from "@/server-actions/meeting";

interface VideoGridProps {
  meetingId: string;
}

export default function VideoGrid({ meetingId }: VideoGridProps) {
  const { participants, meeting } = useMeeting();
  const meetingDbIdRef = useRef<string | null>(null);

  // Get meeting DB ID on mount
  useEffect(() => {
    const fetchMeetingDbId = async () => {
      const result = await getMeetingByVideoSdkId(meetingId);
      if (result.success && result.data) {
        meetingDbIdRef.current = result.data.id;
      }
    };
    fetchMeetingDbId();
  }, [meetingId]);

  // Track participant join/leave events
  useEffect(() => {
    if (!meeting) return;

    const handleParticipantJoined = async (participant: any) => {
      if (!meetingDbIdRef.current) return;

      // Add participant to database
      await addParticipant(
        meetingDbIdRef.current,
        participant.id,
        participant.micOn || false,
        participant.webcamOn || false,
      );

      // Record join event
      await recordMeetingEvent(meetingDbIdRef.current, participant.id, "join", {
        participantName: participant.displayName,
        micEnabled: participant.micOn,
        cameraEnabled: participant.webcamOn,
      });
    };

    const handleParticipantLeft = async (participant: any) => {
      if (!meetingDbIdRef.current) return;

      // Record participant leave
      await recordParticipantLeave(meetingDbIdRef.current, participant.id);

      // Record leave event
      await recordMeetingEvent(
        meetingDbIdRef.current,
        participant.id,
        "leave",
        {
          participantName: participant.displayName,
        },
      );
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
