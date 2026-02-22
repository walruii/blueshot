"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageList } from "./_components/MessageList";
import Sidebar from "./_components/Sidebar";
import { authClient } from "@/lib/auth-client";
import { Session } from "@/types/sessionType";
import LoadingConversations from "@/components/loading/LoadingConversations";
import { InboxDirect, InboxGroup } from "@/types/chat";
import {
  getDirectConversations,
  getGroupConversations,
} from "@/server-actions/conversations";

export default function ConversationsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState([]);
  const [directConversations, setDirectConversations] = useState<InboxDirect[]>(
    [],
  );
  const [groupConversations, setGroupConversations] = useState<InboxGroup[]>(
    [],
  );
  const [selected, setSelected] = useState<InboxDirect | InboxGroup | null>(
    null,
  );
  const [input, setInput] = useState("");

  const setConversation = (id: string | null) => {
    if (!id) return;
    //TODO
  };

  useEffect(() => {
    const init = async () => {
      const session = await authClient.getSession();
      if (session.data) {
        setSession(session.data);
      }

      const directConversations = await getDirectConversations();
      console.log(directConversations);
      if (directConversations && directConversations.length > 0) {
        setDirectConversations(directConversations);
        setSelected(directConversations[0]);
      }

      const groupConversations = await getGroupConversations();
      console.log(groupConversations);
      if (groupConversations && groupConversations.length > 0) {
        setGroupConversations(groupConversations);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selected) {
      //TODO
    }
  }, [selected]);

  if (!session) {
    return <LoadingConversations />;
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground dark">
      <Sidebar
        directConversations={directConversations}
        groupConversations={groupConversations}
        selectedId={selected?.id || null}
        onSelect={setConversation}
        session={session}
      />
      {/* Chat area */}
      {selected ? (
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
                messages={messages}
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
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Select a conversation to start chatting!
          </p>
        </div>
      )}
    </div>
  );
}
