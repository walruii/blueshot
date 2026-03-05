"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import ParticipantListItem from "./ParticipantListItem";
import { useState, useEffect } from "react";
import { getExternalParticipantStatus } from "@/server-actions/meeting";

interface ParticipantsTabProps {
  participantIds: string[];
  meetingDbId: string;
}

interface ExternalParticipants {
  [userId: string]: boolean;
}

export default function ParticipantsTab({
  participantIds,
  meetingDbId,
}: ParticipantsTabProps) {
  const [externalParticipants, setExternalParticipants] =
    useState<ExternalParticipants>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExternalStatus = async () => {
      if (participantIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getExternalParticipantStatus(
          meetingDbId,
          participantIds,
        );

        if (result.success && result.data) {
          setExternalParticipants(result.data);
        } else if (!result.success) {
          console.error(
            "Failed to fetch external participant status:",
            result.error,
          );
        }
      } catch (error) {
        console.error("Error fetching external participant status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExternalStatus();
  }, [participantIds, meetingDbId]);

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-2">
        {participantIds.length > 0 ? (
          participantIds.map((participantId) => (
            <ParticipantListItem
              key={participantId}
              participantId={participantId}
              isExternal={externalParticipants[participantId] || false}
            />
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            No participants yet
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
