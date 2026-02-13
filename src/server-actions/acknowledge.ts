"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Result } from "@/types/returnType";
import { formatUserEventState, UserEventState } from "@/types/userEventState";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const acknowledgeEvent = async (
  userEventStateId: string,
): Promise<Result<UserEventState | null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session)
      return { success: false, error: "Invalid Seesion Try again Later" };
    const { data: ues, error: someEr } = await supabaseAdmin
      .from("event_user_state")
      .select("event!inner ( created_by )")
      .eq("id", userEventStateId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!ues) {
      return { success: false, error: "UES not found" };
    }
    if (someEr) {
      console.error(someEr);
      return { success: false, error: "UES not found" };
    }

    const { error } = await supabaseAdmin
      .from("event_user_state")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", userEventStateId);

    if (error) {
      console.error(error);
      return { success: false, error: "db failed to update event user state" };
    }
    supabaseAdmin
      .channel(`user_inbox_${ues.event.created_by}`)
      .httpSend("UPDATE_ACK", {});

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
