"use server";

import { auth } from "@/lib/auth";
import { Result } from "@/types/returnType";
import { headers } from "next/headers";
import { getEvent } from "./event";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const deleteEvent = async (
  eventId: string,
): Promise<Result<undefined>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) return { success: false, error: "Invalid session" };
    const event = await getEvent(eventId);
    if (!event) return { success: false, error: "Event Not Found" };
    if (event.userId !== session.user.id)
      return { success: false, error: "Only the Creator can delete event" };
    const { error } = await supabaseAdmin
      .from("event")
      .delete()
      .eq("id", eventId);
    if (error) {
      console.error(error);
      return { success: false, error: "Error deleting event from DB." };
    }
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
