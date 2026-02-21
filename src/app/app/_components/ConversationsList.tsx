"use client";

import { useEffect, useState } from "react";
import { ConversationListItem } from "./ConversationListItem";
import {
  getUserConversations,
  createDirectConversation,
} from "@/server-actions/chat";
import { supabaseAnon } from "@/lib/supabaseAnon";
import type { ConversationWithMetadata } from "@/types/chat";

export function ConversationsList() {
  const [conversations, setConversations] = useState<
    ConversationWithMetadata[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await getUserConversations();
    if (res.success) {
      const sorted = res.data.sort(
        (a, b) =>
          new Date(b.last_message_at || 0).getTime() -
          new Date(a.last_message_at || 0).getTime(),
      );
      setConversations(sorted);
      subscribe(sorted.map((c) => c.id));
    }
    setLoading(false);
  }

  function subscribe(ids: string[]) {
    if (ids.length === 0) return;
    const chan = supabaseAnon
      .channel("conversation-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=in.(${ids.join(",")})`,
        },
        (payload) => {
          const msg: any = payload.new;
          setConversations((prev) => {
            let updated = prev.map((c) => {
              if (c.id === msg.conversation_id) {
                return {
                  ...c,
                  last_message_at: msg.created_at,
                  last_message_preview: msg.content,
                  unread_count: c.unread_count + 1,
                } as ConversationWithMetadata;
              }
              return c;
            });
            // move the updated conversation to top
            updated.sort(
              (a, b) =>
                new Date(b.last_message_at || 0).getTime() -
                new Date(a.last_message_at || 0).getTime(),
            );
            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      supabaseAnon.removeChannel(chan);
    };
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleNewChat}
          className="px-3 py-1 bg-primary text-primary-foreground rounded"
        >
          New Chat
        </button>
      </div>
      {conversations.map((c) => (
        <ConversationListItem key={c.id} conversation={c} />
      ))}
    </div>
  );

  async function handleNewChat() {
    const otherUser = prompt("Enter user ID to chat with");
    if (!otherUser) return;

    const res = await createDirectConversation(otherUser);
    if (res.success) {
      // navigate to the route using the other user's ID; ChatPage will
      // resolve/create the conversation on the server and redirect again if
      // necessary.
      window.location.href = `/app/chat/direct/${otherUser}`;
    } else {
      alert("Failed to start chat: " + res.error);
    }
  }
}
