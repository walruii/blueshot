"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";

export const acknowledgeEvent = async (
  eventParticipantId: string,
): Promise<Result<null>> => {
  try {
    const { data: ep, error: someEr } = await supabaseAdmin
      .from("event_participant")
      .select("event!inner ( user_id )")
      .eq("id", eventParticipantId)
      .maybeSingle();

    if (!ep) {
      return { success: false, err: "EventP not found" };
    }
    if (someEr) {
      console.error(someEr);
      return { success: false, err: "EventP not found" };
    }

    const { error } = await supabaseAdmin
      .from("event_participant")
      .update({ acknowledgement: true })
      .eq("id", eventParticipantId);

    if (error) {
      console.error(error);
      return { success: false, err: "db failed to update event participant" };
    }
    console.log(ep.event.user_id);
    supabaseAdmin
      .channel(`user_inbox_${ep.event.user_id}`)
      .httpSend("UPDATE_ACK", {});

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, err: "Internal Server Error" };
  }
};
