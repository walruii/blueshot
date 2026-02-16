"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Database } from "@/types/database.types";
import { EventInput } from "@/types/event";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  CreatorInfo,
  getAffectedUserIds,
  notifyAffectedUsers,
} from "./notification";
import { resolvePermissionsForEvent } from "./utils/permissionUtils";

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
    const creator: CreatorInfo = {
      name: session.user.name,
      email: session.user.email,
    };
    await notifyAffectedUsers(eventDB, "NEW_EVENT", creator, event.permissions);

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
