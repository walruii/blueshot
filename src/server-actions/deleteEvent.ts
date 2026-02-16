"use server";

import { auth } from "@/lib/auth";
import { Result } from "@/types/returnType";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CreatorInfo, notifyAffectedUsers } from "./notification";
import { getEventPermissions } from "./utils/permissionUtils";

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

    // Check if user has permission to delete (creator OR admin on event group)
    const permissions = await getEventPermissions(session.user.id, eventId);
    if (!permissions.canDelete) {
      return {
        success: false,
        error: "You don't have permission to delete this event",
      };
    }

    const { error } = await supabaseAdmin
      .from("event")
      .delete()
      .eq("id", eventId);
    if (error) {
      console.error(error);
      return { success: false, error: "Error deleting event from DB." };
    }
    const creator: CreatorInfo = {
      name: session.user.name,
      email: session.user.email,
    };
    notifyAffectedUsers(event, "DELETE_EVENT", creator);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
