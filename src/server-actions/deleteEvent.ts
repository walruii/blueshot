"use server";

import { auth } from "@/lib/auth";
import { Result } from "@/types/returnType";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyAffectedUsers } from "./notification";

export const deleteEvent = async (
  eventId: string,
): Promise<Result<undefined>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) return { success: false, error: "Invalid session" };
    const { data: event } = await supabaseAdmin
      .from("event")
      .select()
      .eq("id", eventId)
      .maybeSingle();
    if (!event) return { success: false, error: "Event Not Found" };
    if (event.created_by !== session.user.id)
      return { success: false, error: "Only the Creator can delete event" };
    const { error } = await supabaseAdmin
      .from("event")
      .delete()
      .eq("id", eventId);
    if (error) {
      console.error(error);
      return { success: false, error: "Error deleting event from DB." };
    }
    notifyAffectedUsers(event, "DELETE_EVENT");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
