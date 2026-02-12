"use server";
import {
  Event,
  EventDB,
  EventMap,
  formatEvent,
  formatEventMap,
} from "@/types/event";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const { data: event, error }: PostgrestSingleResponse<EventDB | null> =
      await supabaseAdmin.from("event").select().eq("id", id).maybeSingle();
    if (error) {
      console.error("DBError running getEvent", error);
      return null;
    }
    if (!event) return null;
    return formatEvent(event);
  } catch (err) {
    console.error("Undefined Error getEvent", err);
    return null;
  }
};

export const getEvents = async (): Promise<EventMap> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return new Map();
    const { data: events, error } = await supabaseAdmin.rpc("get_user_events", {
      request_id: session.user.id,
    });

    if (error) {
      console.error("Error running getEvents", error);
      return new Map();
    }
    if (!events) {
      return new Map();
    }
    const eveMap = formatEventMap(events);
    return eveMap;
  } catch (err) {
    console.error("Undefined Error getEvents", err);
    return new Map();
  }
};
