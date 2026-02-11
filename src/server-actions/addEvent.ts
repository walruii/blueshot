"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EventDB, EventInput } from "@/types/eventTypes";
import { EmailCheckResult, Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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
