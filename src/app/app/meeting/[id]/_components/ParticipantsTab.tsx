"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import ParticipantListItem from "./ParticipantListItem";

interface ParticipantsTabProps {
  participantIds: string[];
}

export default function ParticipantsTab({
  participantIds,
}: ParticipantsTabProps) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-2">
        {participantIds.length > 0 ? (
          participantIds.map((participantId) => (
            <ParticipantListItem
              key={participantId}
              participantId={participantId}
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
