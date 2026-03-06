"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InboxItem } from "@/types/chat";
import { authClient } from "@/lib/auth-client";
import LoadingChatArea from "./LoadingChatArea";
import { useConversation } from "../_hooks/use-conversation";
import SummaryButton from "@/components/SummaryButton";

export default function ChatArea({
  conversation,
}: {
  conversation: InboxItem;
}) {
  const id = conversation.id ?? "";
  const {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
    scrollContainerRef,
    sendMessage,
  } = useConversation(id);

  const { data: session } = authClient.useSession();
  const [input, setInput] = useState("");

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      sendMessage(trimmed);
      setInput("");
    }
  };

  // auto-scroll to bottom when a new message arrives
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, scrollContainerRef]);

  // determine display values
  const isDirect = conversation.type === "direct";
  const image = isDirect
    ? conversation.partner_image || undefined
    : conversation.avatar_url || undefined;
  const name = isDirect
    ? conversation.partner_name || conversation.partner_email || "Unknown"
    : conversation.name || "Group";

  if (!conversation.id) {
    return <LoadingChatArea />;
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Avatar>
          {image && <AvatarImage src={image || ""} alt={name} />}
          <AvatarFallback>{name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{name}</span>
      </div>
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-6 bg-background min-h-0"
      >
        <div ref={loadMoreRef} className="h-px w-full shrink-0" />
        <MessageList
          messages={messages}
          currentUserId={session?.user?.id || ""}
          isLoadingOlder={isLoadingOlder}
          hasMoreBefore={hasMoreBefore}
          isInitialized={isInitialized}
        />
      </div>
      {/* AI Summary Button */}
      <div className="px-4 pt-2 shrink-0">
        <SummaryButton conversationId={id} />
      </div>
      {/* Input */}
      <form
        className="p-4 bg-card border-t border-border flex gap-2"
        onSubmit={handleFormSubmit}
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
  );
}
