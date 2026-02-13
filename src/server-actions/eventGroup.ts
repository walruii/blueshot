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
 * Helper to resolve permission entries to database format
 */
async function resolvePermissionsForEventGroup(
  eventGroupId: string,
  permissions: PermissionEntry[],
): Promise<
  Array<{
    event_group_id: string;
    user_id: string | null;
    user_group_id: string | null;
    role: number;
  }>
> {
  const results: Array<{
    event_group_id: string;
    user_id: string | null;
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
            event_group_id: eventGroupId,
            user_id: user.id,
            user_group_id: null,
            role: entry.role,
          });
        }
      }
    }
  }

  // Add user group entries directly
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
