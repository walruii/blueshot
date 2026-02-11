"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  EventNotification,
  EventNotificationDB,
} from "@/types/notificationType";
import {
  formatEventNotification,
  formatEventNotifications,
} from "@/utils/transformers";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { headers } from "next/headers";

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
