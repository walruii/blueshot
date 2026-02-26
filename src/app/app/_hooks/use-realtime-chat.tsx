import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageWithSender } from "@/types/chat";
import { fetchUserProfileAction } from "@/server-actions/chat";
import { getSupabaseAnonClient } from "@/lib/supabase-anon";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

// helper that will take a raw message row from Supabase and convert to
// our MessageWithSender shape. Because realtime payloads don't include
// the joined user details, we optionally fetch the sender after the fact.
async function hydrateMessage(row: any): Promise<MessageWithSender> {
  const userId = row.sender_id || row.user_id;

  // 1. Get current cache from the store
  const cachedUser = useChatStore.getState().users[userId];

  if (cachedUser) {
    return {
      ...row,
      sender: cachedUser, // Instant! No network request needed.
    };
  }

  // 2. ONLY if user is unknown, do a specific Server Action
  // to fetch the user's public profile (NOT the message row).
  const result = await fetchUserProfileAction(userId);

  if (result.success && result.data) {
    return { ...row, sender: result.data };
  }

  // 3. Last resort fallback
  return {
    ...row,
    sender: { id: userId, name: "Unknown User", email: null, image: null },
  };
}

export function useRealtimeChat(convoId: string) {
  useEffect(() => {
    if (!convoId) return;
    // make sure the store has a slot for this convo before any incoming messages
    useChatStore.getState().initializeConversation(convoId);
    let supabase: SupabaseClient;
    let activeChannel: RealtimeChannel;
    const realTimeSetup = async () => {
      supabase = await getSupabaseAnonClient();

      activeChannel = supabase
        .channel(`chat:${convoId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: "any" },
            // This is the "Secret Sauce" for some versions of the SDK
            private: true,
          },
        }) // Use a clean unique channel name
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, and DELETE
            schema: "public",
            table: "message",
            filter: `conversation_id=eq.${convoId}`,
          },
          async (payload) => {
            if (payload.eventType === "DELETE") {
              // Logic to remove message from Zustand if needed
              return;
            }

            // 1. Hydrate the message (get sender info)
            const msg = await hydrateMessage(payload.new);

            // 2. Use the store's upsert logic
            // This handles both new messages and 'sending' -> 'sent' transitions
            useChatStore.getState().upsertMessage(convoId, msg);
          },
        )
        .subscribe((status) => {
          console.log("Realtime Status:", status);
          if (status === "CHANNEL_ERROR") {
            console.error(
              "Access Denied: Your RLS is likely blocking this user.",
            );
          }
          if (status === "TIMED_OUT") {
            console.error(
              "Connection Timed Out: Check your local network/Docker.",
            );
          } else {
            console.log("Supabase Realtime Channel Status:", status);
          }
        });
    };
    realTimeSetup();
    return () => {
      if (supabase && activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [convoId]);
}
