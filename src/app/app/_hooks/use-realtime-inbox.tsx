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

    const setupRealtime = async () => {
      supabaseInstance = await getSupabaseAnonClient();

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

        .on("broadcast", { event: "ADDED_TO_USER_GROUP" }, (p) =>
          notifyAndRefresh(
            "You were added to a user group",
            p.payload?.groupName,
          ),
        )

        .on("broadcast", { event: "REMOVED_FROM_USER_GROUP" }, (p) =>
          notifyAndRefresh(
            "You were removed from a user group",
            p.payload?.groupName,
          ),
        )

        .on("broadcast", { event: "ADDED_TO_EVENT_GROUP" }, (p) =>
          notifyAndRefresh(
            "You were added to an event group",
            p.payload?.groupName,
          ),
        )

        .on("broadcast", { event: "REMOVED_FROM_EVENT_GROUP" }, (p) =>
          notifyAndRefresh("Removed from event group", p.payload?.groupName),
        )

        .on("broadcast", { event: "ADDED_TO_EVENT" }, (p) =>
          notifyAndRefresh("You were added to an event", p.payload?.eventTitle),
        )

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
    };

    setupRealtime();

    // 4. Proper Cleanup
    return () => {
      if (activeChannel && supabaseInstance) {
        supabaseInstance.removeChannel(activeChannel);
      }
    };
  }, [userId, router, showAlert]);
}
