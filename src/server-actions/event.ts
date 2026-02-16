"use server";
import { Event, EventMap, formatEvent, formatEventMap } from "@/types/event";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { CreatorInfo, notifyEventAccessAction } from "./notification";
import { verifyOwnership } from "./utils/authWrapper";
import { fetchAccessDetails, AccessResult } from "./utils/accessUtils";
import { resolvePermissionsForEvent } from "./utils/permissionUtils";

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const { data: event, error } = await supabaseAdmin
      .rpc("get_event", {
        request_id: id,
      })
      .maybeSingle();
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

// Re-export shared access types for backwards compatibility
export type { AccessResult as EventAccessResult } from "./utils/accessUtils";

/**
 * Get all users and user groups with direct access to an event
 * Only accessible by event creator
 */
export const getEventAccess = async (
  eventId: string,
): Promise<Result<AccessResult>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Verify user owns the event
    const ownershipResult = await verifyOwnership(
      "event",
      eventId,
      session.user.id,
    );
    if (!ownershipResult.success) {
      return ownershipResult;
    }

    const accessData = await fetchAccessDetails("event", eventId);
    return { success: true, data: accessData };
  } catch (err) {
    console.error("Unexpected error in getEventAccess:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Add access to an event
 */
export const addAccessToEvent = async (
  eventId: string,
  permissions: PermissionEntry[],
): Promise<Result<{ added: number; failed: number }>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", session.user.id)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found or access denied" };
    }

    const accessInserts = await resolvePermissionsForEvent(
      eventId,
      permissions,
    );

    if (accessInserts.length === 0) {
      return { success: true, data: { added: 0, failed: permissions.length } };
    }

    // Check existing access
    const { data: existingAccess } = await supabaseAdmin
      .from("event_access")
      .select("user_id, user_group_id")
      .eq("event_id", eventId);

    const existingKeys = new Set(
      existingAccess?.map((a) => `${a.user_id}-${a.user_group_id || "null"}`) ||
        [],
    );

    const newInserts = accessInserts.filter(
      (a) => !existingKeys.has(`${a.user_id}-${a.user_group_id || "null"}`),
    );

    let added = 0;

    if (newInserts.length > 0) {
      const { error: accessError } = await supabaseAdmin
        .from("event_access")
        .insert(newInserts);

      if (accessError) {
        console.error("Failed to add access:", accessError);
      } else {
        added = newInserts.length;

        // Notify users who were added (dedupe user IDs)
        const addedUserIds = [...new Set(newInserts.map((a) => a.user_id))];
        const creator: CreatorInfo = {
          name: session.user.name,
          email: session.user.email,
        };

        await notifyEventAccessAction(
          addedUserIds,
          "ADDED_TO_EVENT",
          event.id,
          event.title,
          { id: session.user.id, ...creator },
        );
      }
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { added, failed: accessInserts.length - added },
    };
  } catch (err) {
    console.error("Unexpected error in addAccessToEvent:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Remove access from an event
 */
export const removeAccessFromEvent = async (
  eventId: string,
  targetUserId?: string,
  targetUserGroupId?: string,
): Promise<Result<null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    if (!targetUserId && !targetUserGroupId) {
      return {
        success: false,
        error: "Must specify user or user group to remove",
      };
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", session.user.id)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found or access denied" };
    }

    // Cannot remove owner from their own event
    if (targetUserId === session.user.id) {
      return {
        success: false,
        error: "Cannot remove yourself from the event",
      };
    }

    let query = supabaseAdmin
      .from("event_access")
      .delete()
      .eq("event_id", eventId);

    if (targetUserId && !targetUserGroupId) {
      // Remove direct user access
      query = query.eq("user_id", targetUserId).is("user_group_id", null);
    } else if (targetUserGroupId) {
      // Remove all entries for this user group
      query = query.eq("user_group_id", targetUserGroupId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error removing access:", error);
      return { success: false, error: "Failed to remove access" };
    }

    // Notify removed user (only if it's a direct user, not a group)
    if (targetUserId && !targetUserGroupId) {
      const creator: CreatorInfo = {
        name: session.user.name,
        email: session.user.email,
      };

      await notifyEventAccessAction(
        [targetUserId],
        "REMOVED_FROM_EVENT",
        event.id,
        event.title,
        { id: session.user.id, ...creator },
      );
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in removeAccessFromEvent:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Update an event's event group
 */
export const updateEventGroup = async (
  eventId: string,
  newEventGroupId: string,
): Promise<Result<null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", session.user.id)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found or access denied" };
    }

    // Verify user has access to the new event group
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("id", newEventGroupId)
      .single();

    if (groupError || !newGroup) {
      return { success: false, error: "Event group not found" };
    }

    // Check if user owns or has access to the new group
    const hasAccess =
      newGroup.created_by === session.user.id ||
      (
        await supabaseAdmin
          .from("event_group_access")
          .select("id")
          .eq("event_group_id", newEventGroupId)
          .eq("user_id", session.user.id)
          .maybeSingle()
      ).data !== null;

    if (!hasAccess) {
      return { success: false, error: "No access to target event group" };
    }

    // Update the event
    const { error: updateError } = await supabaseAdmin
      .from("event")
      .update({ event_group_id: newEventGroupId })
      .eq("id", eventId);

    if (updateError) {
      console.error("Error updating event group:", updateError);
      return { success: false, error: "Failed to update event group" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in updateEventGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};
