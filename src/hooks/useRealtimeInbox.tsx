import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { useAlert } from "@/app/(alert)/AlertProvider";

export function useRealtimeInbox(userId: string) {
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const channel = supabaseAnon.channel(`user_inbox_${userId}`);
    channel
      .on("broadcast", { event: "NEW_EVENT" }, (payload) => {
        showAlert({
          title: "You got invited to a new event",
          description: payload.payload?.title,
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "DELETE_EVENT" }, (payload) => {
        showAlert({
          title: "One of the Event's you were in got Deleted",
          description: `${payload.payload?.title}`,
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "UPDATE_ACK" }, () => {
        router.refresh();
      })
      .on("broadcast", { event: "ADDED_TO_USER_GROUP" }, (payload) => {
        showAlert({
          title: "You were added to a user group",
          description: payload.payload?.groupName || "",
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "REMOVED_FROM_USER_GROUP" }, (payload) => {
        showAlert({
          title: "You were removed from a user group",
          description: payload.payload?.groupName || "",
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "ADDED_TO_EVENT_GROUP" }, (payload) => {
        showAlert({
          title: "You were added to an event group",
          description: payload.payload?.groupName || "",
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "REMOVED_FROM_EVENT_GROUP" }, (payload) => {
        showAlert({
          title: "Removed from event group",
          description: `You may no longer see some events from: ${payload.payload?.groupName || ""}`,
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "ADDED_TO_EVENT" }, (payload) => {
        showAlert({
          title: "You were added to an event",
          description: payload.payload?.eventTitle || "",
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "REMOVED_FROM_EVENT" }, (payload) => {
        showAlert({
          title: "You were removed from an event",
          description: payload.payload?.eventTitle || "",
          type: "info",
        });
        router.refresh();
      })
      .subscribe();
    return () => {
      supabaseAnon.removeChannel(channel);
    };
  }, [userId, router, showAlert]);
}
