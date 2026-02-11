"use server";
import { Event, EventDB, EventInput, EventMap } from "@/types/eventTypes";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Result, EmailCheckResult } from "@/types/returnType";
import {
  formatEvent,
  formatEventParticipants,
  formatEventNotifications,
  formatEventNotification,
  formatUpcomingEvents,
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
import { revalidatePath } from "next/cache";
import { UpcomingDB } from "@/types/upcomingType";

export const checkEmailListExist = async (
  emails: string[],
): Promise<Result<EmailCheckResult[]>> => {
  try {
    const { data: users, error } = await supabaseAdmin
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

export const getNotification = async (
  eventId: string,
): Promise<EventNotification | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) return null;
    const {
      data: notif,
      error,
    }: PostgrestSingleResponse<EventNotificationDB | null> = await supabaseAdmin
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
      .eq("event.id", eventId)
      .eq("acknowledgement", false)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) {
      console.error("Error fetching notifications", error);
      return null;
    }
    if (!notif) {
      return null;
    }
    return formatEventNotification(notif);
  } catch (err) {
    console.error(err);
    return null;
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
    }: PostgrestSingleResponse<EventNotificationDB[]> = await supabaseAdmin
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
    const { data: eventDB, error: eventError } = await supabaseAdmin
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

    const { data: userIds, error: memberIdError } = await supabaseAdmin
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

    const participants = userIds.map((u) => {
      if (u.id === event.userId) {
        return {
          event_id: eventDB.id,
          user_id: u.id,
          acknowledgement: true,
          mail_sent: true,
        };
      }
      return {
        event_id: eventDB.id,
        user_id: u.id,
        acknowledgement: false,
        mail_sent: false,
      };
    });

    const { error: ptsError } = await supabaseAdmin
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
    userIds.forEach((user) => {
      supabaseAdmin
        .channel(`user_inbox_${user.id}`)
        .httpSend("NEW_INVITE", { title: event.title });
    });
    revalidatePath("/dashboard");
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
  }: PostgrestSingleResponse<EventParticipantWithUserDB[]> = await supabaseAdmin
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
    const { data: ep, error: someEr } = await supabaseAdmin
      .from("event_participant")
      .select("event!inner ( user_id )")
      .eq("id", eventParticipantId)
      .maybeSingle();

    if (!ep) {
      return { success: false, error: "EventP not found" };
    }
    if (someEr) {
      console.error(someEr);
      return { success: false, error: "EventP not found" };
    }

    const { error } = await supabaseAdmin
      .from("event_participant")
      .update({ acknowledgement: true })
      .eq("id", eventParticipantId);

    if (error) {
      console.error(error);
      return { success: false, error: "db failed to update event participant" };
    }
    console.log(ep.event.user_id);
    supabaseAdmin
      .channel(`user_inbox_${ep.event.user_id}`)
      .httpSend("UPDATE_ACK", {});

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};

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
