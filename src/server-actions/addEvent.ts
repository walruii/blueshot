"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Database } from "@/types/database.types";
import { EventInput } from "@/types/event";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAffectedUserIds, notifyAffectedUsers } from "./notification";

interface EmailCheckResult {
  email: string;
  exist: boolean;
}

export const addEvent = async (
  event: EventInput,
): Promise<Result<Database["public"]["Tables"]["event"]["Row"]>> => {
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

    await addUserStates(eventDB, event.permissions);

    // Send realtime notification to affected users
    await notifyAffectedUsers(eventDB, "NEW_EVENT", event.permissions);

    revalidatePath("/dashboard");
    return { success: true, data: eventDB };
  } catch (err) {
    console.error("Unexpected Error in addEvent: ", err);
    return { success: false, error: "Internal Server Error" };
  }
};

async function addUserStates(
  eventDb: Database["public"]["Tables"]["event"]["Row"],
  permissions?: PermissionEntry[],
) {
  const userIds = await getAffectedUserIds(eventDb, permissions);

  const userStates: {
    event_id: string;
    user_id: string;
    acknowledged_at: string | null;
    event_sent_at: string | null;
  }[] = [];
  userIds.forEach((id) => {
    if (id === eventDb.created_by) {
      userStates.push({
        event_id: eventDb.id,
        user_id: id,
        acknowledged_at: new Date().toISOString(),
        event_sent_at: new Date().toISOString(),
      });
      return;
    }
    userStates.push({
      event_id: eventDb.id,
      user_id: id,
      acknowledged_at: null,
      event_sent_at: new Date().toISOString(),
    });
    return;
  });
  // Create event_user_state for the creator (auto-acknowledged)
  const { error: stateError } = await supabaseAdmin
    .from("event_user_state")
    .insert(userStates);

  if (stateError) {
    console.warn("Failed to create event_user_states ", stateError);
  }
}
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
