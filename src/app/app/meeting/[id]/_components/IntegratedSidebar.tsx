"use client";
import { MessageSquare, FileText, Sparkles, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatTab from "./ChatTab";
import TranscriptTab from "./TranscriptTab";
import SmartNotesTab from "./SmartNotesTab";
import ParticipantsTab from "./ParticipantsTab";
import { isMeetingDebug } from "@/lib/debug";

import { useMeeting } from "@/lib/videosdkWrapper";

export default function IntegratedSidebar({
  meetingDbId,
}: {
  meetingDbId: string;
}) {
  const { participants } = useMeeting();

  // convert participants map to array, add mock entries when debugging
  if (isMeetingDebug() && participants && participants.size === 0) {
    participants.set("user-1", { id: "user-1", displayName: "Alice" });
    participants.set("user-2", { id: "user-2", displayName: "Bob" });
  }
  const participantIds = participants
    ? (Array.from(participants.keys()) as string[])
    : [];

  return (
    <>
      <Tabs defaultValue="chat" className="flex flex-col h-full min-h-0">
        <div className="border-b border-border p-2">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="chat" className="gap-1 text-xs" title="Chat">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="gap-1 text-xs"
              title="Transcript"
            >
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="gap-1 text-xs"
              title="Smart Notes"
            >
              <Sparkles className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="gap-1 text-xs"
              title="Participants"
            >
              <Users className="h-4 w-4" />
              <span className="text-xs">({participantIds.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent
          value="chat"
          className="flex-1 m-0 p-0 min-h-0 flex flex-col"
        >
          <ChatTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent
          value="transcript"
          className="flex-1 m-0 p-0 min-h-0 flex flex-col"
        >
          <TranscriptTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Smart Notes Tab */}
        <TabsContent
          value="notes"
          className="flex-1 m-0 p-0 min-h-0 flex flex-col"
        >
          <SmartNotesTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent
          value="participants"
          className="flex-1 m-0 p-0 min-h-0 flex flex-col"
        >
          <ParticipantsTab
            participantIds={participantIds}
            meetingDbId={meetingDbId}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
