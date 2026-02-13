"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Event, formatEvents } from "@/types/event";
import { headers } from "next/headers";

export const getActiveEvents = async (): Promise<Event[]> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return [];
    const { data: activeEvents, error } = await supabaseAdmin.rpc(
      "get_active_events",
      { requesting_user_id: session.user.id },
    );
    if (error) {
      console.error(error);
      return [];
    }
    if (!activeEvents) return [];
    return formatEvents(activeEvents);
  } catch (err) {
    console.error(err);
    return [];
  }
};
