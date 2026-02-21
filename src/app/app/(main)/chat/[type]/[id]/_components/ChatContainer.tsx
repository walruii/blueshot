"use client";

import { useEffect, useState, useRef } from "react";
import { ConversationHeader } from "./ConversationHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { getMessages } from "@/server-actions/chat";
import { supabaseAnon } from "@/lib/supabaseAnon";
import type { ConversationWithMetadata, MessageWithSender } from "@/types/chat";

interface ChatContainerProps {
  conversation: ConversationWithMetadata;
}

export function ChatContainer({ conversation }: ChatContainerProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // subscribe to realtime on messages table
    const channel = supabaseAnon
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageWithSender]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversation.id]);

  async function loadMessages() {
    setLoading(true);
    const result = await getMessages(conversation.id, {
      limit: 50,
      before: cursor,
    });
    if (result.success) {
      const msgs = result.data.messages;
      setMessages((prev) => [...msgs.reverse(), ...prev]);
      setCursor(result.data.oldestMessageDate || undefined);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      <ConversationHeader conversation={conversation} />
      <MessageList messages={messages} loading={loading} />
      <MessageInput conversationId={conversation.id} />
      <div ref={scrollRef}></div>
    </div>
  );
}
