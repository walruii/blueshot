"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  PermissionEntry,
  Role,
  RoleValue,
  getHigherRole,
} from "@/types/permission";

interface EventAccessInsert {
  event_id: string;
  user_id: string;
  user_group_id: string | null;
  role: number;
}

interface EventGroupAccessInsert {
  event_group_id: string;
  user_id: string | null;
  user_group_id: string | null;
  role: number;
}

/**
 * Resolve emails to user IDs in a single batch query
 */
async function resolveEmailsToUserIds(
  emails: string[],
): Promise<Map<string, string>> {
  if (emails.length === 0) return new Map();

  const { data: users, error } = await supabaseAdmin
    .from("user")
    .select("id, email")
    .in("email", emails);

  if (error || !users) return new Map();

  return new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
}

/**
 * Get all members of multiple user groups in a single batch query
 * Fixes N+1 query issue by batching all group member lookups
 */
async function batchGetUserGroupMembers(
  groupIds: string[],
): Promise<Map<string, string[]>> {
  if (groupIds.length === 0) return new Map();

  const { data: members, error } = await supabaseAdmin
    .from("user_group_member")
    .select("user_group_id, user_id")
    .in("user_group_id", groupIds);

  if (error || !members) return new Map();

  const result = new Map<string, string[]>();
  for (const member of members) {
    const current = result.get(member.user_group_id) || [];
    current.push(member.user_id);
    result.set(member.user_group_id, current);
  }

  return result;
}

/**
 * Resolve permission entries to event_access table format
 * Expands user groups to individual members (user_id is required)
 */
export async function resolvePermissionsForEvent(
  eventId: string,
  permissions: PermissionEntry[],
): Promise<EventAccessInsert[]> {
  const results: EventAccessInsert[] = [];

  // Separate emails and user groups
  const emailEntries = permissions.filter((p) => p.type === "email");
  const groupEntries = permissions.filter((p) => p.type === "userGroup");

  // Batch resolve emails to user IDs
  const emailToUserId = await resolveEmailsToUserIds(
    emailEntries.map((e) => e.identifier.toLowerCase()),
  );

  // Add direct user entries
  for (const entry of emailEntries) {
    const userId = emailToUserId.get(entry.identifier.toLowerCase());
    if (userId) {
      results.push({
        event_id: eventId,
        user_id: userId,
        user_group_id: null,
        role: entry.role,
      });
    }
  }

  // Batch get all user group members (fixes N+1 query)
  const groupIds = groupEntries.map((e) => e.identifier);
  const groupMembers = await batchGetUserGroupMembers(groupIds);

  // Expand user groups to individual members
  for (const entry of groupEntries) {
    const memberIds = groupMembers.get(entry.identifier) || [];
    for (const memberId of memberIds) {
      results.push({
        event_id: eventId,
        user_id: memberId,
        user_group_id: entry.identifier,
        role: entry.role,
      });
    }
  }

  return results;
}

/**
 * Resolve permission entries to event_group_access table format
 * Keeps user groups as references (doesn't expand to members)
 */
export async function resolvePermissionsForEventGroup(
  eventGroupId: string,
  permissions: PermissionEntry[],
): Promise<EventGroupAccessInsert[]> {
  const results: EventGroupAccessInsert[] = [];

  // Separate emails and user groups
  const emailEntries = permissions.filter((p) => p.type === "email");
  const groupEntries = permissions.filter((p) => p.type === "userGroup");

  // Batch resolve emails to user IDs
  const emailToUserId = await resolveEmailsToUserIds(
    emailEntries.map((e) => e.identifier.toLowerCase()),
  );

  // Add direct user entries
  for (const entry of emailEntries) {
    const userId = emailToUserId.get(entry.identifier.toLowerCase());
    if (userId) {
      results.push({
        event_group_id: eventGroupId,
        user_id: userId,
        user_group_id: null,
        role: entry.role,
      });
    }
  }

  // Add user group entries directly (no expansion)
  for (const entry of groupEntries) {
    results.push({
      event_group_id: eventGroupId,
      user_id: null,
      user_group_id: entry.identifier,
      role: entry.role,
    });
  }

  return results;
}

/**
 * Resolve permissions to user IDs (before saving to DB)
 * Useful for getting affected users from new permissions
 * Resolves both direct users and group members
 */
export async function resolvePermissionsToUserIds(
  permissions: PermissionEntry[],
): Promise<string[]> {
  const userIds = new Set<string>();

  const emailEntries = permissions.filter((p) => p.type === "email");
  const groupEntries = permissions.filter((p) => p.type === "userGroup");

  // Resolve emails
  const emailToUserId = await resolveEmailsToUserIds(
    emailEntries.map((e) => e.identifier.toLowerCase()),
  );
  for (const userId of emailToUserId.values()) {
    userIds.add(userId);
  }

  // Get group members
  const groupIds = groupEntries.map((e) => e.identifier);
  const groupMembers = await batchGetUserGroupMembers(groupIds);
  for (const memberIds of groupMembers.values()) {
    for (const memberId of memberIds) {
      userIds.add(memberId);
    }
  }

  return [...userIds];
}

/**
 * Get a user's effective role for an event group
 * Considers: direct access, access via user groups, and owner status
 * Returns the highest role from all access paths, or null if no access
 */
export async function getUserEventGroupRole(
  userId: string,
  eventGroupId: string,
): Promise<RoleValue | null> {
  // Check if user is the owner (treat as ADMIN)
  const { data: eventGroup, error: groupError } = await supabaseAdmin
    .from("event_group")
    .select("created_by")
    .eq("id", eventGroupId)
    .maybeSingle();

  if (groupError || !eventGroup) {
    return null;
  }

  // Owner has implicit ADMIN access
  if (eventGroup.created_by === userId) {
    return Role.ADMIN;
  }

  // Get direct user access
  const { data: directAccess } = await supabaseAdmin
    .from("event_group_access")
    .select("role")
    .eq("event_group_id", eventGroupId)
    .eq("user_id", userId);

  // Get user's group memberships
  const { data: userGroups } = await supabaseAdmin
    .from("user_group_member")
    .select("user_group_id")
    .eq("user_id", userId);

  const userGroupIds = userGroups?.map((g) => g.user_group_id) || [];

  // Get access via user groups
  let groupAccess: { role: number }[] = [];
  if (userGroupIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("event_group_access")
      .select("role")
      .eq("event_group_id", eventGroupId)
      .in("user_group_id", userGroupIds);
    groupAccess = data || [];
  }

  // Combine all access entries and find highest role
  const allRoles = [
    ...(directAccess?.map((a) => a.role as RoleValue) || []),
    ...(groupAccess.map((a) => a.role as RoleValue) || []),
  ];

  if (allRoles.length === 0) {
    return null;
  }

  return allRoles.reduce((highest, current) => getHigherRole(highest, current));
}

/**
 * Check if user is the owner of an event group
 */
export async function isEventGroupOwner(
  userId: string,
  eventGroupId: string,
): Promise<boolean> {
  const { data: eventGroup } = await supabaseAdmin
    .from("event_group")
    .select("created_by")
    .eq("id", eventGroupId)
    .maybeSingle();

  return eventGroup?.created_by === userId;
}

/**
 * Get user's permissions for a specific event
 * Returns object with canEdit, canDelete, canManageAccess, canChangeEventGroup, isOwner flags
 */
export async function getEventPermissions(
  userId: string,
  eventId: string,
): Promise<{
  canEdit: boolean;
  canDelete: boolean;
  canManageAccess: boolean;
  canChangeEventGroup: boolean;
  isOwner: boolean;
  isEventCreator: boolean;
}> {
  // Get the event details
  const { data: event } = await supabaseAdmin
    .from("event")
    .select("created_by, event_group_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return {
      canEdit: false,
      canDelete: false,
      canManageAccess: false,
      canChangeEventGroup: false,
      isOwner: false,
      isEventCreator: false,
    };
  }

  const isEventCreator = event.created_by === userId;

  // If no event group, only creator has full access
  if (!event.event_group_id) {
    return {
      canEdit: isEventCreator,
      canDelete: isEventCreator,
      canManageAccess: isEventCreator,
      canChangeEventGroup: isEventCreator,
      isOwner: isEventCreator,
      isEventCreator,
    };
  }

  // Get user's role in the event group
  const role = await getUserEventGroupRole(userId, event.event_group_id);
  const isGroupOwner = await isEventGroupOwner(userId, event.event_group_id);

  // Permission logic:
  // - canEdit: creator with READ_WRITE+ OR ADMIN
  // - canDelete: creator OR ADMIN
  // - canManageAccess: creator OR ADMIN
  // - canChangeEventGroup: only the event creator (not admins)
  // - isOwner: group owner (for UI purposes like showing all management options)
  const hasWriteAccess = role !== null && role >= Role.READ_WRITE;
  const hasAdminAccess = role === Role.ADMIN;

  return {
    canEdit: (isEventCreator && hasWriteAccess) || hasAdminAccess,
    canDelete: isEventCreator || hasAdminAccess,
    canManageAccess: isEventCreator || hasAdminAccess,
    canChangeEventGroup: isEventCreator && hasWriteAccess,
    isOwner: isGroupOwner,
    isEventCreator,
  };
}
