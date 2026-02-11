"use server";
import { Event, EventDB, EventMap } from "@/types/eventTypes";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { formatEvent, eventsToMap } from "@/utils/transformers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const { data: event, error }: PostgrestSingleResponse<EventDB | null> =
      await supabaseAdmin.from("event").select().eq("id", id).maybeSingle();
    if (error) {
      console.error("Error getting getEvent", error);
      return null;
    }
    if (!event) return null;
    return formatEvent(event);
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getEvents = async (): Promise<EventMap> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return new Map();
    const {
      data: events,
      error,
    }: PostgrestSingleResponse<{ event: EventDB }[]> = await supabaseAdmin
      .from("event_participant")
      .select(`event (*)`)
      .eq("user_id", session?.user.id);
    if (error) {
      console.error("Error fetching events", error);
      return new Map();
    }
    if (!events) {
      return new Map();
    }
    const eveMap = eventsToMap(events);
    return eveMap;
  } catch (err) {
    console.error(err);
    return new Map();
  }
};
