"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EventDB, EventInput } from "@/types/event";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

interface EmailCheckResult {
  email: string;
  exist: boolean;
}

export const addEvent = async (event: EventInput): Promise<Result<EventDB>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Invalid session" };
    }

    if (session.user.id !== event.createdBy) {
      return { success: false, error: "Invalid data provided" };
    }

    // Create the event
    const { data: eventDB, error: eventError } = await supabaseAdmin
      .from("event")
      .insert({
        title: event.title,
        description: event.description,
        from: event.from.toISOString(),
        to: event.to ? event.to.toISOString() : null,
        created_by: event.createdBy,
        event_group_id: event.eventGroupId,
        type: event.type,
        status: "default",
      })
      .select()
      .single();

    if (eventError || !eventDB) {
      console.error("Event creation failed: ", eventError);
      return { success: false, error: "DB Server Error Adding Event" };
    }

    // Process permissions if any
    if (event.permissions && event.permissions.length > 0) {
      const accessInserts = await resolvePermissionsForEvent(
        eventDB.id,
        event.permissions,
      );

      if (accessInserts.length > 0) {
        const { error: accessError } = await supabaseAdmin
          .from("event_access")
          .insert(accessInserts);

        if (accessError) {
          console.error("Failed to add event access:", accessError);
          // Don't fail the whole operation, event is created
        }
      }
    }

    // Create event_user_state for the creator (auto-acknowledged)
    const { error: stateError } = await supabaseAdmin
      .from("event_user_state")
      .insert({
        event_id: eventDB.id,
        user_id: event.createdBy,
        source_group_id: event.eventGroupId,
        acknowledged_at: new Date().toISOString(),
        event_sent_at: new Date().toISOString(),
      });

    if (stateError) {
      console.warn(
        "Failed to create event_user_state for creator:",
        stateError,
      );
    }

    // Send realtime notification to affected users
    await notifyAffectedUsers(
      eventDB.id,
      event.eventGroupId,
      event.permissions,
    );

    revalidatePath("/dashboard");
    return { success: true, data: eventDB };
  } catch (err) {
    console.error("Unexpected Error in addEvent: ", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Resolve permission entries to database format for event_access
 */
async function resolvePermissionsForEvent(
  eventId: string,
  permissions: PermissionEntry[],
): Promise<
  Array<{
    event_id: string;
    user_id: string;
    user_group_id: string | null;
    role: number;
  }>
> {
  const results: Array<{
    event_id: string;
    user_id: string;
    user_group_id: string | null;
    role: number;
  }> = [];

  // Separate emails and user groups
  const emailEntries = permissions.filter((p) => p.type === "email");
  const groupEntries = permissions.filter((p) => p.type === "userGroup");

  // Resolve emails to user IDs
  if (emailEntries.length > 0) {
    const emails = emailEntries.map((e) => e.identifier);
    const { data: users, error } = await supabaseAdmin
      .from("user")
      .select("id, email")
      .in("email", emails);

    if (!error && users) {
      for (const entry of emailEntries) {
        const user = users.find((u) => u.email === entry.identifier);
        if (user) {
          results.push({
            event_id: eventId,
            user_id: user.id,
            user_group_id: null,
            role: entry.role,
          });
        }
      }
    }
  }

  // Add user group entries - need to resolve group members
  for (const entry of groupEntries) {
    // Get all members of the user group
    const { data: members, error } = await supabaseAdmin
      .from("user_group_member")
      .select("user_id")
      .eq("user_group_id", entry.identifier);

    if (!error && members) {
      for (const member of members) {
        results.push({
          event_id: eventId,
          user_id: member.user_id,
          user_group_id: entry.identifier,
          role: entry.role,
        });
      }
    }
  }

  return results;
}

/**
 * Notify users who have access to the event
 */
async function notifyAffectedUsers(
  eventId: string,
  eventGroupId: string,
  permissions: PermissionEntry[],
): Promise<void> {
  try {
    // Collect user IDs from permissions
    const userIds = new Set<string>();

    const emailEntries = permissions.filter((p) => p.type === "email");
    if (emailEntries.length > 0) {
      const emails = emailEntries.map((e) => e.identifier);
      const { data: users } = await supabaseAdmin
        .from("user")
        .select("id")
        .in("email", emails);

      users?.forEach((u) => userIds.add(u.id));
    }

    // Get users from user groups
    const groupEntries = permissions.filter((p) => p.type === "userGroup");
    for (const entry of groupEntries) {
      const { data: members } = await supabaseAdmin
        .from("user_group_member")
        .select("user_id")
        .eq("user_group_id", entry.identifier);

      members?.forEach((m) => userIds.add(m.user_id));
    }

    // Get users from event group access
    const { data: groupAccess } = await supabaseAdmin
      .from("event_group_access")
      .select("user_id")
      .eq("event_group_id", eventGroupId)
      .not("user_id", "is", null);

    groupAccess?.forEach((a) => {
      if (a.user_id) userIds.add(a.user_id);
    });

    // Send realtime notifications
    for (const userId of userIds) {
      supabaseAdmin.channel(`user_inbox_${userId}`).send({
        type: "broadcast",
        event: "NEW_EVENT",
        payload: { eventId },
      });
    }
  } catch (err) {
    console.error("Error notifying users:", err);
  }
}

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
