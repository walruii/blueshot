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
      .on("broadcast", { event: "NEW_INVITE" }, (payload) => {
        showAlert({
          title: "You got invited to a new event",
          description: payload.payload.title,
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
