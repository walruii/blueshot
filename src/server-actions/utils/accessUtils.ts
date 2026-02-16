"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Shared types for access results
 */
export interface AccessUser {
  userId: string;
  email: string;
  name: string;
  role: number;
}

export interface AccessUserGroup {
  id: string;
  name: string;
  role: number;
}

export interface AccessResult {
  users: AccessUser[];
  userGroups: AccessUserGroup[];
}

interface AccessEntry {
  user_id: string | null;
  user_group_id: string | null;
  role: number;
}

type AccessTableConfig = {
  table: "event_access" | "event_group_access";
  idColumn: "event_id" | "event_group_id";
};

const ACCESS_CONFIGS: Record<"event" | "eventGroup", AccessTableConfig> = {
  event: { table: "event_access", idColumn: "event_id" },
  eventGroup: { table: "event_group_access", idColumn: "event_group_id" },
};

/**
 * Fetch access details for an entity (event or event group)
 * Combines users and user groups with their details
 */
export async function fetchAccessDetails(
  entityType: "event" | "eventGroup",
  entityId: string,
): Promise<AccessResult> {
  const config = ACCESS_CONFIGS[entityType];

  // Fetch all access entries
  const { data: accessEntries, error: accessError } = await supabaseAdmin
    .from(config.table)
    .select("user_id, user_group_id, role")
    .eq(config.idColumn, entityId);

  if (accessError || !accessEntries) {
    console.error(`Error fetching ${entityType} access:`, accessError);
    return { users: [], userGroups: [] };
  }

  const entries = accessEntries as AccessEntry[];

  // Separate user IDs and user group IDs
  const userIds = entries
    .filter((e) => e.user_id && !e.user_group_id)
    .map((e) => e.user_id as string);

  const userGroupIds = entries
    .filter((e) => e.user_group_id)
    .map((e) => e.user_group_id as string);

  // Parallelize user and group fetches
  const [users, userGroups] = await Promise.all([
    fetchUserDetails(userIds, entries),
    fetchUserGroupDetails(userGroupIds, entries),
  ]);

  return { users, userGroups };
}

/**
 * Fetch user details and combine with role from access entries
 */
async function fetchUserDetails(
  userIds: string[],
  entries: AccessEntry[],
): Promise<AccessUser[]> {
  if (userIds.length === 0) return [];

  const { data: userData } = await supabaseAdmin
    .from("user")
    .select("id, email, name")
    .in("id", userIds);

  if (!userData) return [];

  return userData.map((user) => {
    const entry = entries.find(
      (e) => e.user_id === user.id && !e.user_group_id,
    );
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: entry?.role || 1,
    };
  });
}

/**
 * Fetch user group details and combine with role from access entries
 */
async function fetchUserGroupDetails(
  userGroupIds: string[],
  entries: AccessEntry[],
): Promise<AccessUserGroup[]> {
  if (userGroupIds.length === 0) return [];

  const { data: groupData } = await supabaseAdmin
    .from("user_group")
    .select("id, name")
    .in("id", userGroupIds);

  if (!groupData) return [];

  return groupData.map((grp) => {
    const entry = entries.find((e) => e.user_group_id === grp.id);
    return {
      id: grp.id,
      name: grp.name,
      role: entry?.role || 1,
    };
  });
}
