"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  EventGroup,
  EventGroupInput,
  formatEventGroup,
} from "@/types/eventGroup";
import { PermissionEntry } from "@/types/permission";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notifyEventGroupAction } from "./notification";
import { fetchAccessDetails, AccessResult } from "./utils/accessUtils";
import {
  resolvePermissionsForEventGroup,
  getUserEventGroupRole,
} from "./utils/permissionUtils";
import { Role, isAdmin, RoleValue } from "@/types/permission";

const PERSONAL_GROUP_NAME = "Personal";

/**
 * Get all event groups accessible by the user (created by them or via event_group_access)
 */
export const getAccessibleEventGroups = async (): Promise<
  Result<EventGroup[]>
> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    const userId = session.user.id;

    // Get groups created by the user
    const { data: createdGroups, error: createdError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("created_by", userId);

    if (createdError) {
      console.error("Error fetching created groups:", createdError);
      return { success: false, error: "Failed to fetch event groups" };
    }

    // Get groups the user has access to via event_group_access
    const { data: accessGroups, error: accessError } = await supabaseAdmin
      .from("event_group_access")
      .select("event_group_id")
      .eq("user_id", userId);

    if (accessError) {
      console.error("Error fetching access groups:", accessError);
      return { success: false, error: "Failed to fetch event groups" };
    }

    // Get the actual group details for access groups
    const accessGroupIds = accessGroups?.map((a) => a.event_group_id) || [];

    let sharedGroups: EventGroup[] = [];
    if (accessGroupIds.length > 0) {
      const { data: sharedGroupsData, error: sharedError } = await supabaseAdmin
        .from("event_group")
        .select("*")
        .in("id", accessGroupIds);

      if (sharedError) {
        console.error("Error fetching shared groups:", sharedError);
      } else {
        sharedGroups = (sharedGroupsData || []).map(formatEventGroup);
      }
    }

    // Combine and deduplicate
    const allGroups = [
      ...(createdGroups || []).map(formatEventGroup),
      ...sharedGroups,
    ];
    const uniqueGroups = allGroups.filter(
      (group, index, self) =>
        index === self.findIndex((g) => g.id === group.id),
    );

    return { success: true, data: uniqueGroups };
  } catch (err) {
    console.error("Unexpected error in getAccessibleEventGroups:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Get event groups where the user has write access (READ_WRITE or ADMIN)
 * Used for filtering which event groups can be selected when creating events
 */
export const getWritableEventGroups = async (): Promise<
  Result<EventGroup[]>
> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    const userId = session.user.id;

    // Get groups created by the user (owner always has write access)
    const { data: createdGroups, error: createdError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("created_by", userId);

    if (createdError) {
      console.error("Error fetching created groups:", createdError);
      return { success: false, error: "Failed to fetch event groups" };
    }

    // Get groups the user has write access to directly (role >= READ_WRITE)
    const { data: directWriteAccess, error: directError } = await supabaseAdmin
      .from("event_group_access")
      .select("event_group_id")
      .eq("user_id", userId)
      .gte("role", Role.READ_WRITE);

    if (directError) {
      console.error("Error fetching direct write access:", directError);
      return { success: false, error: "Failed to fetch event groups" };
    }

    // Get user's group memberships
    const { data: userGroupMemberships } = await supabaseAdmin
      .from("user_group_member")
      .select("user_group_id")
      .eq("user_id", userId);

    const userGroupIds =
      userGroupMemberships?.map((g) => g.user_group_id) || [];

    // Get groups the user has write access to via user groups
    let groupWriteAccess: { event_group_id: string }[] = [];
    if (userGroupIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("event_group_access")
        .select("event_group_id")
        .in("user_group_id", userGroupIds)
        .gte("role", Role.READ_WRITE);
      groupWriteAccess = data || [];
    }

    // Combine all group IDs
    const accessGroupIds = [
      ...(directWriteAccess?.map((a) => a.event_group_id) || []),
      ...groupWriteAccess.map((a) => a.event_group_id),
    ];

    // Get the actual group details
    let sharedGroups: EventGroup[] = [];
    if (accessGroupIds.length > 0) {
      const { data: sharedGroupsData, error: sharedError } = await supabaseAdmin
        .from("event_group")
        .select("*")
        .in("id", [...new Set(accessGroupIds)]);

      if (sharedError) {
        console.error("Error fetching shared groups:", sharedError);
      } else {
        sharedGroups = (sharedGroupsData || []).map(formatEventGroup);
      }
    }

    // Combine and deduplicate
    const allGroups = [
      ...(createdGroups || []).map(formatEventGroup),
      ...sharedGroups,
    ];
    const uniqueGroups = allGroups.filter(
      (group, index, self) =>
        index === self.findIndex((g) => g.id === group.id),
    );

    return { success: true, data: uniqueGroups };
  } catch (err) {
    console.error("Unexpected error in getWritableEventGroups:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Create a new event group with optional permissions
 */
export const createEventGroup = async (
  input: EventGroupInput,
): Promise<Result<EventGroup>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    if (session.user.id !== input.createdBy) {
      return { success: false, error: "Invalid user" };
    }

    // Create the event group
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from("event_group")
      .insert({
        name: input.name,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (groupError || !groupData) {
      console.error("Event group creation failed:", groupError);
      return { success: false, error: "Failed to create event group" };
    }

    // Process permissions - resolve emails to user IDs
    if (input.permissions && input.permissions.length > 0) {
      const accessInserts = await resolvePermissionsForEventGroup(
        groupData.id,
        input.permissions,
      );

      if (accessInserts.length > 0) {
        const { error: accessError } = await supabaseAdmin
          .from("event_group_access")
          .insert(accessInserts);

        if (accessError) {
          console.error("Failed to add permissions:", accessError);
          // Don't fail the whole operation, group is created
        } else {
          // Notify users who were added (only direct users, not via user groups)
          const directUserIds = accessInserts
            .filter((a) => a.user_id !== null)
            .map((a) => a.user_id as string);

          if (directUserIds.length > 0) {
            await notifyEventGroupAction(
              directUserIds,
              "ADDED_TO_EVENT_GROUP",
              groupData.id,
              groupData.name,
              {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
              },
            );
          }
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true, data: formatEventGroup(groupData) };
  } catch (err) {
    console.error("Unexpected error in createEventGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Get or create the user's personal event group
 */
export const getOrCreatePersonalGroup = async (): Promise<
  Result<EventGroup>
> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    const userId = session.user.id;

    // Check if personal group exists
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("created_by", userId)
      .eq("name", PERSONAL_GROUP_NAME)
      .single();

    if (existingGroup) {
      return { success: true, data: formatEventGroup(existingGroup) };
    }

    // If not found (PGRST116), create it
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking personal group:", fetchError);
      return { success: false, error: "Failed to check personal group" };
    }

    // Create personal group
    const { data: newGroup, error: createError } = await supabaseAdmin
      .from("event_group")
      .insert({
        name: PERSONAL_GROUP_NAME,
        created_by: userId,
      })
      .select()
      .single();

    if (createError || !newGroup) {
      console.error("Failed to create personal group:", createError);
      return { success: false, error: "Failed to create personal group" };
    }

    // Group access to user
    const { error } = await supabaseAdmin.from("event_group_access").insert({
      event_group_id: newGroup.id,
      user_id: session.user.id,
      role: 3,
    });

    if (error) {
      console.error("Error adding user to event group access", error);
      return {
        success: false,
        error: "Failed to add you to group access contact Support",
      };
    }

    return { success: true, data: formatEventGroup(newGroup) };
  } catch (err) {
    console.error("Unexpected error in getOrCreatePersonalGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Add access to an existing event group
 * Accessible by owner OR admin on event group
 */
export const addAccessToEventGroup = async (
  groupId: string,
  permissions: PermissionEntry[],
): Promise<Result<{ added: number; failed: number }>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Check if user has admin access to the group
    const userRole = await getUserEventGroupRole(session.user.id, groupId);
    if (!userRole || !isAdmin(userRole)) {
      return { success: false, error: "Access denied" };
    }

    // Get the group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return { success: false, error: "Group not found" };
    }

    const accessInserts = await resolvePermissionsForEventGroup(
      groupId,
      permissions,
    );

    if (accessInserts.length === 0) {
      return { success: true, data: { added: 0, failed: permissions.length } };
    }

    // Check existing access
    const { data: existingAccess } = await supabaseAdmin
      .from("event_group_access")
      .select("user_id, user_group_id")
      .eq("event_group_id", groupId);

    const existingUserIds = new Set(
      existingAccess?.filter((a) => a.user_id).map((a) => a.user_id) || [],
    );
    const existingGroupIds = new Set(
      existingAccess
        ?.filter((a) => a.user_group_id)
        .map((a) => a.user_group_id) || [],
    );

    const newInserts = accessInserts.filter((a) => {
      if (a.user_id) return !existingUserIds.has(a.user_id);
      if (a.user_group_id) return !existingGroupIds.has(a.user_group_id);
      return false;
    });

    let added = 0;

    if (newInserts.length > 0) {
      const { error: accessError } = await supabaseAdmin
        .from("event_group_access")
        .insert(newInserts);

      if (accessError) {
        console.error("Failed to add access:", accessError);
      } else {
        added = newInserts.length;

        // Notify users who were added (only direct users, not via user groups)
        const directUserIds = newInserts
          .filter((a) => a.user_id !== null)
          .map((a) => a.user_id as string);

        if (directUserIds.length > 0) {
          await notifyEventGroupAction(
            directUserIds,
            "ADDED_TO_EVENT_GROUP",
            groupId,
            group.name,
            {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            },
          );
        }
      }
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { added, failed: accessInserts.length - added },
    };
  } catch (err) {
    console.error("Unexpected error in addAccessToEventGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Remove access from an event group (user or user group)
 * Accessible by owner OR admin on event group
 * Admins cannot remove other admins - only the owner can
 */
export const removeAccessFromEventGroup = async (
  groupId: string,
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

    // Check if user has admin access to the group
    const userRole = await getUserEventGroupRole(session.user.id, groupId);
    if (!userRole || !isAdmin(userRole)) {
      return { success: false, error: "Access denied" };
    }

    // Get the group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from("event_group")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return { success: false, error: "Group not found" };
    }

    const isOwner = group.created_by === session.user.id;

    // Cannot remove the owner from their own group
    if (targetUserId === group.created_by) {
      return {
        success: false,
        error: "Cannot remove the group owner",
      };
    }

    // If not the owner, check if target is an admin (admins can't remove other admins)
    if (!isOwner && targetUserId) {
      const targetRole = await getUserEventGroupRole(targetUserId, groupId);
      if (targetRole && isAdmin(targetRole)) {
        return {
          success: false,
          error: "Only the group owner can remove admins",
        };
      }
    }

    // If not the owner and removing a user group, check if it grants admin access
    if (!isOwner && targetUserGroupId) {
      const { data: accessData } = await supabaseAdmin
        .from("event_group_access")
        .select("role")
        .eq("event_group_id", groupId)
        .eq("user_group_id", targetUserGroupId)
        .maybeSingle();
      if (accessData && isAdmin(accessData.role as RoleValue)) {
        return {
          success: false,
          error: "Only the group owner can remove admin user groups",
        };
      }
    }

    let query = supabaseAdmin
      .from("event_group_access")
      .delete()
      .eq("event_group_id", groupId);

    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    } else if (targetUserGroupId) {
      query = query.eq("user_group_id", targetUserGroupId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error removing access:", error);
      return { success: false, error: "Failed to remove access" };
    }

    // Notify removed user (only if it's a direct user, not a group)
    if (targetUserId) {
      await notifyEventGroupAction(
        [targetUserId],
        "REMOVED_FROM_EVENT_GROUP",
        groupId,
        group.name,
        {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
      );
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in removeAccessFromEventGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

// Re-export shared access types for backwards compatibility
export type { AccessResult as EventGroupAccessResult } from "./utils/accessUtils";

/**
 * Get all users and user groups with access to an event group
 * Accessible by owner OR admin on event group
 */
export const getEventGroupAccess = async (
  groupId: string,
): Promise<Result<AccessResult>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Check if user has admin access to the group
    const userRole = await getUserEventGroupRole(session.user.id, groupId);
    if (!userRole || !isAdmin(userRole)) {
      return { success: false, error: "Access denied" };
    }

    const accessData = await fetchAccessDetails("eventGroup", groupId);
    return { success: true, data: accessData };
  } catch (err) {
    console.error("Unexpected error in getEventGroupAccess:", err);
    return { success: false, error: "Internal Server Error" };
  }
};
