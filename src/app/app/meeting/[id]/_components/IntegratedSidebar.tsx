"use client";
import { MessageSquare, FileText, Sparkles, Users } from "lucide-react";
import { useMeeting } from "@videosdk.live/react-sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatTab from "./ChatTab";
import TranscriptTab from "./TranscriptTab";
import SmartNotesTab from "./SmartNotesTab";
import ParticipantsTab from "./ParticipantsTab";

export default function IntegratedSidebar({
  meetingDbId,
}: {
  meetingDbId: string;
}) {
  const { participants } = useMeeting();

  // Convert participants Map to array of IDs
  const participantIds = participants ? Array.from(participants.keys()) : [];

  return (
    <div className="w-80 h-full border-l border-border bg-card flex-col z-40">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        {/* Tabs Header */}
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
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
          <ChatTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="flex-1 m-0 p-0">
          <TranscriptTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Smart Notes Tab */}
        <TabsContent value="notes" className="flex-1 m-0 p-0">
          <SmartNotesTab meetingDbId={meetingDbId} />
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="flex-1 m-0 p-0">
          <ParticipantsTab
            participantIds={participantIds}
            meetingDbId={meetingDbId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
