"use client";

import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { authClient } from "@/lib/auth-client";
import { useChatStore } from "@/stores/chatStore";
import { useInfiniteMessages } from "../../_hooks/use-infinite-messages";
import { useRealtimeChat } from "@/app/app/_hooks/use-realtime-chat";

/**
 * A helper hook that encapsulates everything a chat page needs: paging, realtime,
 * and a sendMessage helper.  It also exposes the refs that the chat area needs
 * to wire up infinite scroll and scroll compensation.
 */
export function useConversation(conversationId: string) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // paging & initial load
  const {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
    loadOlder,
  } = useInfiniteMessages(conversationId, { scrollContainerRef });

  // realtime listener
  useRealtimeChat(conversationId);

  const { data: session } = authClient.useSession();

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;
      const user = session?.user;
      if (!user) return;

      const tempId = crypto.randomUUID();
      const now = new Date().toISOString();

      // optimistic append
      useChatStore.getState().appendMessage(conversationId, {
        id: tempId,
        conversation_id: conversationId,
        content: trimmed,
        content_type: "text",
        created_at: now,
        reply_to_id: null,
        deleted_at: null,
        meeting_id: null,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
        },
      });

      try {
        const { sendMessage: sendAction } =
          await import("@/server-actions/chat");
        const result = await sendAction({
          conversationId,
          content: trimmed,
          id: tempId,
        });

        if (!result.success) {
          console.error("sendMessage failed", result.error);
          // we could flag the message or show a toast — left as a TODO
        }
      } catch (err) {
        console.error("error sending message", err);
      }
    },
    [conversationId, session?.user],
  );

  return {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
    loadOlder,
    scrollContainerRef,
    sendMessage,
  };
}
