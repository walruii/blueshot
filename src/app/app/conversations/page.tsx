"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConversationWithMetadata, MessageWithSender } from "@/types/chat";
import { MessageList } from "./_components/MessageList";
import Sidebar from "./_components/Sidebar";
import { authClient } from "@/lib/auth-client";
import { Session } from "@/types/sessionType";
import LoadingConversations from "@/components/loading/LoadingConversations";

// Mock data using ConversationWithMetadata and MessageWithSender
const conversations: (ConversationWithMetadata & {
  messages: MessageWithSender[];
})[] = [
  {
    id: "1",
    type: "direct",
    user_group_id: null,
    event_id: null,
    name: "Alice",
    description: null,
    avatar_url: "https://randomuser.me/api/portraits/women/1.jpg",
    created_at: "2026-02-22T10:00:00Z",
    updated_at: "2026-02-22T10:30:00Z",
    last_message_at: "2026-02-22T10:30:00Z",
    unread_count: 0,
    message_count: 3,
    last_message_preview: "See you soon!",
    participant_count: 2,
    is_muted: false,
    messages: [
      {
        id: "m1",
        conversation_id: "1",
        sender_id: "2",
        content: "Hey!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T10:00:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: {
          id: "2",
          name: "Alice",
          image: "https://randomuser.me/api/portraits/women/1.jpg",
        },
      },
      {
        id: "m2",
        conversation_id: "1",
        sender_id: "1",
        content: "Hi Alice!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T10:01:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: { id: "1", name: "You", image: null },
      },
      {
        id: "m3",
        conversation_id: "1",
        sender_id: "2",
        content: "See you soon!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T10:30:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: {
          id: "2",
          name: "Alice",
          image: "https://randomuser.me/api/portraits/women/1.jpg",
        },
      },
    ],
  },
  {
    id: "2",
    type: "direct",
    user_group_id: null,
    event_id: null,
    name: "Bob",
    description: null,
    avatar_url: "https://randomuser.me/api/portraits/men/2.jpg",
    created_at: "2026-02-22T09:00:00Z",
    updated_at: "2026-02-22T09:15:00Z",
    last_message_at: "2026-02-22T09:15:00Z",
    unread_count: 1,
    message_count: 3,
    last_message_preview: "Thanks!",
    participant_count: 2,
    is_muted: false,
    messages: [
      {
        id: "m4",
        conversation_id: "2",
        sender_id: "3",
        content: "Hello!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T09:00:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: {
          id: "3",
          name: "Bob",
          image: "https://randomuser.me/api/portraits/men/2.jpg",
        },
      },
      {
        id: "m5",
        conversation_id: "2",
        sender_id: "1",
        content: "Hi Bob!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T09:05:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: { id: "1", name: "You", image: null },
      },
      {
        id: "m6",
        conversation_id: "2",
        sender_id: "3",
        content: "Thanks!",
        content_type: "text",
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-02-22T09:15:00Z",
        meeting_id: null,
        sent_during_meeting: null,
        sender: {
          id: "3",
          name: "Bob",
          image: "https://randomuser.me/api/portraits/men/2.jpg",
        },
      },
    ],
  },
];

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const [input, setInput] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  const selected = conversations.find((c) => c.id === selectedId);
  useEffect(() => {
    const fetchSession = async () => {
      const session = await authClient.getSession();
      if (session.data) {
        setSession(session.data);
      }
    };
    fetchSession();
  }, []);

  if (!session || selectedId === null) {
    return <LoadingConversations />;
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground dark">
      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        session={session}
      />
      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Avatar>
            <AvatarImage
              src={selected?.avatar_url || undefined}
              alt={selected?.name || undefined}
            />
            <AvatarFallback>{selected?.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{selected?.name}</span>
        </div>
        {/* Messages */}
        <ScrollArea className="flex-1 p-6 bg-background">
          {selected && (
            <MessageList
              messages={selected.messages}
              currentUserId={session.user.id}
            />
          )}
        </ScrollArea>
        {/* Input */}
        <form
          className="p-4 bg-card border-t border-border flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            // In a real app, you'd update state here
            setInput("");
          }}
        >
          <Input
            className="flex-1"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" variant="default">
            Send
          </Button>
        </form>
      </main>
    </div>
  );
}
