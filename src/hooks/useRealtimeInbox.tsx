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
          description: payload.title,
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "DELETE_EVENT" }, (payload) => {
        showAlert({
          title: "One of the Event's you were in got Deleted",
          description: `${payload.title}`,
          type: "info",
        });
        router.refresh();
      })
      .on("broadcast", { event: "UPDATE_ACK" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      supabaseAnon.removeChannel(channel);
    };
  }, [userId, router, showAlert]);
}
