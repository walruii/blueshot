import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";
import { getSupabaseAnonClient } from "@/lib/supabase-anon";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export function useRealtimeInbox(userId: string) {
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!userId) return;

    let activeChannel: RealtimeChannel | null = null;
    let supabaseInstance: SupabaseClient;
    let isDisposed = false;

    const setupRealtime = async () => {
      const client = await getSupabaseAnonClient();
      if (isDisposed) return;
      supabaseInstance = client;

      activeChannel = supabaseInstance.channel(`user_inbox_${userId}`);

      const notifyAndRefresh = (title: string, description?: string) => {
        showAlert({
          title,
          description: description || "",
          type: "info",
        });
        router.refresh();
      };

      // 3. Attach Listeners
      activeChannel
        .on("broadcast", { event: "NEW_EVENT" }, (p) =>
          notifyAndRefresh("You got invited to a new event", p.payload?.title),
        )

        .on("broadcast", { event: "DELETE_EVENT" }, (p) =>
          notifyAndRefresh(
            "One of the Events you were in was deleted",
            p.payload?.title,
          ),
        )

        .on("broadcast", { event: "ADDED_TO_USER_GROUP" }, async (p) => {
          notifyAndRefresh(
            "You were added to a user group",
            p.payload?.groupName,
          );
          // also refresh group conversations state
          try {
            const { getGroupConversations } =
              await import("@/server-actions/conversations");
            const { useChatStore } = await import("@/stores/chatStore");
            const groups = await getGroupConversations();
            useChatStore.getState().setGroupConversations(groups ?? []);
          } catch (err) {
            console.error("Failed to refresh groups state", err);
          }
        })

        // new conversation event: update zustand store directly
        .on("broadcast", { event: "NEW_DIRECT_CONVERSATION" }, async (p) => {
          showAlert({
            title: "New conversation",
            description: "You were added to a new direct message",
            type: "info",
          });
          // also refresh the layout so the server query for the inbox runs again
          router.refresh();
          try {
            const { conversationId } = p.payload || {};
            if (conversationId) {
              // fetch the new convo and add it to store
              const conv = await import("@/server-actions/conversations").then(
                (mod) => mod.getDirectConversationById(conversationId),
              );
              if (conv?.id) {
                const { useChatStore } = await import("@/stores/chatStore");
                useChatStore.getState().addDirectConversation(conv);
              }
            }
          } catch (err) {
            console.error(
              "Error handling new direct conversation payload",
              err,
            );
          }
        })

        .on("broadcast", { event: "REMOVED_FROM_USER_GROUP" }, (p) =>
          notifyAndRefresh(
            "You were removed from a user group",
            p.payload?.groupName,
          ),
        )

        .on("broadcast", { event: "ADDED_TO_EVENT_GROUP" }, async (p) => {
          notifyAndRefresh(
            "You were added to an event group",
            p.payload?.groupName,
          );
          try {
            const { getGroupConversations } =
              await import("@/server-actions/conversations");
            const { useChatStore } = await import("@/stores/chatStore");
            const groups = await getGroupConversations();
            useChatStore.getState().setGroupConversations(groups ?? []);
          } catch (err) {
            console.error("Failed to refresh groups state", err);
          }
        })

        .on("broadcast", { event: "REMOVED_FROM_EVENT_GROUP" }, (p) =>
          notifyAndRefresh("Removed from event group", p.payload?.groupName),
        )

        .on("broadcast", { event: "ADDED_TO_EVENT" }, async (p) => {
          notifyAndRefresh("You were added to an event", p.payload?.eventTitle);
          try {
            const { getGroupConversations } =
              await import("@/server-actions/conversations");
            const { useChatStore } = await import("@/stores/chatStore");
            const groups = await getGroupConversations();
            useChatStore.getState().setGroupConversations(groups ?? []);
          } catch (err) {
            console.error("Failed to refresh groups state", err);
          }
        })

        .on("broadcast", { event: "REMOVED_FROM_EVENT" }, (p) =>
          notifyAndRefresh(
            "You were removed from an event",
            p.payload?.eventTitle,
          ),
        )

        .on("broadcast", { event: "UPDATE_ACK" }, () => router.refresh())

        .subscribe((status: string) => {
          if (status === "SUBSCRIBED")
            console.log(`Inbox listener active: ${userId}`);
        });

      if (isDisposed && activeChannel) {
        supabaseInstance.removeChannel(activeChannel);
      }
    };

    setupRealtime();

    // 4. Proper Cleanup
    return () => {
      isDisposed = true;
      if (activeChannel && supabaseInstance) {
        supabaseInstance.removeChannel(activeChannel);
      }
    };
  }, [userId, router, showAlert]);
}
