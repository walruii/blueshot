"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UpcomingDB } from "@/types/upcomingType";
import { formatUpcomingEvents } from "@/utils/transformers";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { headers } from "next/headers";

export const getUpcomingEvents = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return [];
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const tomMidnight = new Date();
    tomMidnight.setDate(tomMidnight.getDate() + 1);
    tomMidnight.setHours(0, 0, 0, 0);
    const {
      data: upcomingEvents,
      error,
    }: PostgrestSingleResponse<UpcomingDB[]> = await supabaseAdmin
      .from("event_participant")
      .select(
        `id,
          event!inner (
            id,
            title,
            date,
            from,
            to,
            user!inner (
              id,
              name,
              email
            )
          )`,
      )
      .eq("user_id", session.user.id)
      .gt("event.from", tenMinutesAgo)
      .lt("event.from", tomMidnight.toISOString());
    if (error) {
      console.error(error);
      return [];
    }

    if (upcomingEvents.length === 0 || !upcomingEvents) {
      return [];
    }
    const sortedEvents = formatUpcomingEvents(upcomingEvents).sort(
      (a, b) =>
        new Date(a.eventFrom).getTime() - new Date(b.eventFrom).getTime(),
    );

    return sortedEvents;
  } catch (err) {
    console.error(err);
    return [];
  }
};
