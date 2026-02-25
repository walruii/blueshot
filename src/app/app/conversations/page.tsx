"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageList } from "./_components/MessageList";
import Sidebar from "./_components/Sidebar";
import { authClient } from "@/lib/auth-client";
import { Session } from "@/types/sessionType";
import LoadingConversations from "@/components/loading/LoadingConversations";
import { sendMessage } from "@/server-actions/chat";
import { useInfiniteMessages } from "../_hooks/use-infinite-messages";
import { useRealtimeChat } from "../_hooks/use-realtime-chat";
import { useChatStore } from "@/stores/chatStore";
import type { MessageWithSender } from "@/types/chat";
import { useConversationsState } from "./_hooks/use-conversations-state";
import type { InboxDirect, InboxGroup } from "@/types/chat";

export default function ConversationsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const {
    directConversations,
    groupConversations,
    selectedTab,
    setSelectedTab,
    selectedConversation,
    selectDirect,
    selectGroup,
    handleDirectConversationCreated,
  } = useConversationsState();

  const conversationId = selectedConversation?.id ?? "";
  const {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
  } = useInfiniteMessages(conversationId, {
    scrollContainerRef,
    pageSize: 20,
  });

  useRealtimeChat(conversationId);

  useEffect(() => {
    const init = async () => {
      const session = await authClient.getSession();
      if (session.data) {
        setSession(session.data);
      }
    };
    init();
  }, []);

  if (!session) {
    return <LoadingConversations />;
  }

  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!conversationId) return;
    const content = input.trim();
    if (!content) return;

    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimistic: MessageWithSender = {
      id,
      conversation_id: conversationId,
      content,
      content_type: "text",
      created_at: new Date().toISOString(),
      reply_to_id: null,
      deleted_at: null,
      meeting_id: null,
      sender: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      },
    };

    useChatStore.getState().upsertMessage(conversationId, optimistic);
    setInput("");

    const result = await sendMessage({
      conversationId,
      content,
      id,
      contentType: "text",
    });
    if (!result.success) {
      console.error("Failed to send message:", result.error);
    } else if (result.data) {
      // Ensure we reconcile local optimistic content with server-hydrated sender/timestamps.
      useChatStore.getState().upsertMessage(conversationId, result.data);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground dark">
      <Sidebar
        directConversations={directConversations}
        groupConversations={groupConversations}
        selected={selectedConversation}
        onSelectDirect={(id) => selectDirect(id)}
        onSelectGroup={(id) => selectGroup(id)}
        onConversationCreated={handleDirectConversationCreated}
        session={session}
        setSelectedTab={setSelectedTab}
        selectedTab={selectedTab}
      />
      {/* Chat area */}
      {selectedConversation ? (
        <main className="flex-1 flex flex-col min-h-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
            <Avatar>
              <AvatarImage
                src={
                  selectedConversation.type === "direct"
                    ? (selectedConversation.partner_image ?? undefined)
                    : (selectedConversation.avatar_url ?? undefined)
                }
                alt={
                  selectedConversation.type === "direct"
                    ? (selectedConversation.partner_name ?? "")
                    : (selectedConversation.name ?? "")
                }
              />
              <AvatarFallback>
                {selectedConversation.type === "direct"
                  ? (selectedConversation.partner_name?.[0] ?? "?")
                  : (selectedConversation.name?.[0] ?? "?")}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">
              {selectedConversation.type === "direct"
                ? selectedConversation.partner_name
                : selectedConversation.name}
            </span>
          </div>
          {/* Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-6 bg-background min-h-0"
          >
            <div ref={loadMoreRef} className="h-px w-full shrink-0" />
            <MessageList
              messages={messages}
              currentUserId={session.user.id}
              isLoadingOlder={isLoadingOlder}
              hasMoreBefore={hasMoreBefore}
              isInitialized={isInitialized}
            />
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
