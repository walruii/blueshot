"use client";

import { useState, useEffect } from "react";
import ChatArea from "../../_components/ChatArea";
import { getGroupConversationById } from "@/server-actions/conversations";
import type { InboxGroup } from "@/types/chat";
import LoadingChatArea from "../../_components/LoadingChatArea";
import { useParams } from "next/navigation";

export default function GroupConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<InboxGroup | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let canceled = false;

    const fetchConv = async () => {
      for (let attempt = 0; attempt < 5 && !canceled; attempt++) {
        const conv = await getGroupConversationById(id);
        if (conv && conv.id) {
          setConversation(conv);
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!canceled) setError(true);
    };

    fetchConv();
    return () => {
      canceled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  if (!conversation) {
    return <LoadingChatArea />;
  }

  return <ChatArea conversation={conversation} />;
}
