"use server";
import { Event, EventMap, formatEvent, formatEventMap } from "@/types/event";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { CreatorInfo, notifyEventAccessAction } from "./notification";
import { fetchAccessDetails, AccessResult } from "./utils/accessUtils";
import {
  resolvePermissionsForEvent,
  getEventPermissions,
  getUserEventGroupRole,
} from "./utils/permissionUtils";
import { canWrite } from "@/types/permission";

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const { data: event, error } = await supabaseAdmin
      .rpc("get_event", {
        request_id: id,
      })
      .maybeSingle();
    if (error) {
      if (error.code === "22P02") return null;
      console.error("DBError running getEvent", error);
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
 * Accessible by event creator OR admin on event group
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

    // Check if user has permission to manage access
    const permissions = await getEventPermissions(session.user.id, eventId);
    if (!permissions.canManageAccess) {
      return { success: false, error: "Access denied" };
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
 * Accessible by event creator OR admin on event group
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

    // Check if user has permission to manage access
    const userPermissions = await getEventPermissions(session.user.id, eventId);
    if (!userPermissions.canManageAccess) {
      return { success: false, error: "Access denied" };
    }

    // Get the event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found" };
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
 * Accessible by event creator OR admin on event group
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

    // Check if user has permission to manage access
    const userPermissions = await getEventPermissions(session.user.id, eventId);
    if (!userPermissions.canManageAccess) {
      return { success: false, error: "Access denied" };
    }

    // Get the event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found" };
    }

    // Cannot remove the event creator from their own event
    if (targetUserId === event.created_by) {
      return {
        success: false,
        error: "Cannot remove the event creator",
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
 * Only accessible by the event creator (not admins)
 * Changing event group is a structural change that only the owner should control
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

    // Get the event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found" };
    }

    // Only the event creator can change the event group
    if (event.created_by !== session.user.id) {
      return {
        success: false,
        error: "Only the event creator can change the event group",
      };
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

    // Check if user has READ_WRITE+ access to the new group
    const targetGroupRole = await getUserEventGroupRole(
      session.user.id,
      newEventGroupId,
    );
    if (!targetGroupRole || !canWrite(targetGroupRole)) {
      return { success: false, error: "No write access to target event group" };
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
