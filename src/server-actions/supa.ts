"use server";
import { Event, EventDB, EventInput, EventMap } from "@/types/eventTypes";
import supabase from "@/lib/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Result, EmailCheckResult } from "@/types/returnType";
import {
  formatEvent,
  formatEventParticipants,
  formatEventNotifications,
} from "@/utils/transformers";
import {
  EventParticipantWithUserDB,
  EventParticipant,
} from "@/types/eventParticipantType";
import {
  EventNotificationDB,
  EventNotification,
} from "@/types/notificationType";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const checkEmailListExist = async (
  emails: string[],
): Promise<Result<EmailCheckResult[]>> => {
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
    const results: EmailCheckResult[] = emails.map((email) => ({
      email,
      exist: foundEmails.has(email),
    }));
    return { success: true, data: results };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to validate emails" };
  }
};

const eventsToMap = (events: { event: EventDB }[]): EventMap => {
  const newMap: EventMap = new Map();
  events.forEach(({ event: item }: { event: EventDB }) => {
    const existing = newMap.get(new Date(item.date).toDateString()) || [];
    newMap.set(new Date(item.date).toDateString(), [
      ...existing,
      formatEvent(item),
    ]);
  });
  return newMap;
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const { data: event, error }: PostgrestSingleResponse<EventDB> =
      await supabase.from("event").select().eq("id", id).single();
    if (error) {
      console.error("Error getting getEvent", error);
      return null;
    }
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
    }: PostgrestSingleResponse<{ event: EventDB }[]> = await supabase
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

export const getNotifications = async (): Promise<EventNotification[]> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) return [];
    const {
      data: notifs,
      error,
    }: PostgrestSingleResponse<EventNotificationDB[]> = await supabase
      .from("event_participant")
      .select(
        `id,
         user (id, email, name),
          event!inner (
            id,
            title,
            user!inner (
              id,
              name,
              email
            )
          ),
          mail_sent, acknowledgement`,
      )
      .neq("event.user_id", session.user.id)
      .eq("acknowledgement", false)
      .eq("user_id", session.user.id);
    if (error) {
      console.error("Error fetching notifications", error);
      return [];
    }
    if (!notifs || notifs.length === 0) {
      return [];
    }
    return formatEventNotifications(notifs);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const addEvent = async (
  event: EventInput,
  members: string[],
): Promise<Result<EventDB>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return { success: false, error: "Invalid session" };
    }

    if (session.user.id !== event.userId) {
      return { success: false, error: "Invalid data provided" };
    }
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

export const getEventMembers = async (
  eventId: string,
): Promise<Result<EventParticipant[]>> => {
  const {
    data: eventMembers,
    error: eventParticipantDBError,
  }: PostgrestSingleResponse<EventParticipantWithUserDB[]> = await supabase
    .from("event_participant")
    .select(
      `id, user!inner ( id, email ), event_id, mail_sent, acknowledgement`,
    )
    .eq("event_id", eventId);

  if (eventParticipantDBError) {
    console.error(
      "Failed to fetch event Participants: ",
      eventParticipantDBError,
    );
    return { success: false, error: "DB Error fetcting participants" };
  }

  if (!eventMembers || !Array.isArray(eventMembers)) {
    console.warn("eventMembers is not an array:", eventMembers);
    return { success: true, data: [] };
  }

  if (eventMembers.length === 0) {
    return { success: true, data: [] };
  }

  const members: EventParticipant[] = formatEventParticipants(eventMembers);
  return { success: true, data: members };
};

export const acknowledgeEvent = async (
  eventParticipantId: string,
): Promise<Result<null>> => {
  try {
    const { error } = await supabase
      .from("event_participant")
      .update({ acknowledgement: true })
      .eq("id", eventParticipantId);

    if (error) {
      console.error(error);
      return { success: false, error: "db failed to update event participant" };
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
