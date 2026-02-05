"use server";
import { TEvent, TEventDB, TEventDTO, TEventMap } from "@/types/eventTypes";
import supabase from "@/lib/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ResultObject, TEmailResult } from "@/types/returnType";
import { DBEventToEvent } from "@/utils/util";

export const checkEmailListExist = async (
  emails: string[],
): Promise<ResultObject<TEmailResult[]>> => {
  try {
    const { data: users, error } = await supabase
      .from("user")
      .select("email")
      .in("email", emails);
    if (error) {
      console.error("Failed to check emails: ", error);
      return { success: false, error: "Failed to validate emails" };
    }

    const foundEmails = new Set(users?.map((u) => u.email) || []);
    const results: TEmailResult[] = emails.map((email) => ({
      email,
      exist: foundEmails.has(email),
    }));
    return { success: true, data: results };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to validate emails" };
  }
};

const eventsToMap = (events: TEventDB[]): TEventMap => {
  const newMap: TEventMap = new Map();
  events.forEach((item: TEventDB) => {
    const existing = newMap.get(item.date) || [];
    newMap.set(item.date, [...existing, DBEventToEvent(item)]);
  });
  return newMap;
};

export const getEvent = async (id: string): Promise<TEvent | null> => {
  try {
    const { data: event, error }: PostgrestSingleResponse<TEventDB> =
      await supabase.from("event").select().eq("id", id).single();
    if (error) {
      console.error("Error getting getEvent", error);
      return null;
    }
    return DBEventToEvent(event);
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getEvents = async (): Promise<TEventMap> => {
  try {
    const { data: events }: PostgrestSingleResponse<TEventDB[]> = await supabase
      .from("event")
      .select();
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

export const addEvent = async (
  event: TEventDTO,
  members: string[],
): Promise<ResultObject<TEventDB>> => {
  try {
    const { data: eventDB, error: eventError } = await supabase
      .from("event")
      .insert({
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        from: event.from.toISOString(),
        to: event.to ? event.to.toISOString() : null,
        user_id: event.userId,
      })
      .select()
      .single();

    if (eventError || !eventDB) {
      console.error("Event creation failed: ", eventError);
      return { success: false, error: "DB Server Error Adding Event" };
    }

    const { data: userIds, error: memberIdError } = await supabase
      .from("user")
      .select("id, email")
      .in("email", [...members]);
    if (memberIdError || !userIds) {
      console.error("Failed to fetch user IDs:", memberIdError);
      return {
        success: false,
        error: "DB Server Error Getting UserIds",
      };
    }

    if (userIds.length !== members.length) {
      const foundEmails = userIds.map((u) => u.email);
      const missingEmails = members.filter((m) => !foundEmails.includes(m));
      console.warn("Some members not found:", missingEmails);
    }

    const participants = userIds.map((u) => ({
      event_id: eventDB.id,
      user_id: u.id,
    }));

    const { error: ptsError } = await supabase
      .from("event_participant")
      .insert(participants)
      .select();

    if (ptsError) {
      console.warn("ptsError:", ptsError);
      return {
        success: false,
        error: "DB Server Error Adding Members to Participant List",
      };
    }

    return { success: true, data: eventDB };
  } catch (err) {
    console.error("Unexpected Error in addEvent: ", err);
    return { success: false, error: "Internal Server Error" };
  }
};
