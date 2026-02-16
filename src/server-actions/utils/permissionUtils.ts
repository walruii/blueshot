"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PermissionEntry } from "@/types/permission";

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
