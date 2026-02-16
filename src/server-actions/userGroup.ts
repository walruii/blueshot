"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserGroup, UserGroupInput, formatUserGroup } from "@/types/userGroup";
import { Result } from "@/types/returnType";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notifyUserGroupAction } from "./notification";

/**
 * Get all user groups accessible by the user (created by them or member of)
 */
export const getAccessibleUserGroups = async (): Promise<
  Result<UserGroup[]>
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
      .from("user_group")
      .select("*")
      .eq("created_by", userId);

    if (createdError) {
      console.error("Error fetching created user groups:", createdError);
      return { success: false, error: "Failed to fetch user groups" };
    }

    // Get groups the user is a member of
    const { data: membershipData, error: memberError } = await supabaseAdmin
      .from("user_group_member")
      .select("user_group_id")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error fetching user group memberships:", memberError);
      return { success: false, error: "Failed to fetch user groups" };
    }

    // Get the actual group details for member groups
    const memberGroupIds = membershipData?.map((m) => m.user_group_id) || [];

    let memberGroups: UserGroup[] = [];
    if (memberGroupIds.length > 0) {
      const { data: memberGroupsData, error: memberGroupsError } =
        await supabaseAdmin
          .from("user_group")
          .select("*")
          .in("id", memberGroupIds);

      if (memberGroupsError) {
        console.error("Error fetching member groups:", memberGroupsError);
      } else {
        memberGroups = (memberGroupsData || []).map(formatUserGroup);
      }
    }

    // Combine and deduplicate
    const allGroups = [
      ...(createdGroups || []).map(formatUserGroup),
      ...memberGroups,
    ];
    const uniqueGroups = allGroups.filter(
      (group, index, self) =>
        index === self.findIndex((g) => g.id === group.id),
    );

    return { success: true, data: uniqueGroups };
  } catch (err) {
    console.error("Unexpected error in getAccessibleUserGroups:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Create a new user group with optional members
 */
export const createUserGroup = async (
  input: UserGroupInput,
): Promise<Result<UserGroup>> => {
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

    // Create the user group
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from("user_group")
      .insert({
        name: input.name,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (groupError || !groupData) {
      console.error("User group creation failed:", groupError);
      return { success: false, error: "Failed to create user group" };
    }

    // Add members if provided
    if (input.memberEmails && input.memberEmails.length > 0) {
      // Resolve emails to user IDs
      const { data: users, error: usersError } = await supabaseAdmin
        .from("user")
        .select("id, email")
        .in("email", input.memberEmails);

      if (usersError) {
        console.error("Error resolving user emails:", usersError);
      } else if (users && users.length > 0) {
        const memberInserts = users.map((user) => ({
          user_group_id: groupData.id,
          user_id: user.id,
        }));

        const { error: memberError } = await supabaseAdmin
          .from("user_group_member")
          .insert(memberInserts);

        if (memberError) {
          console.error("Failed to add members:", memberError);
          // Don't fail the whole operation, group is created
        } else {
          // Notify added members
          const addedUserIds = users.map((u) => u.id);
          await notifyUserGroupAction(
            addedUserIds,
            "ADDED_TO_USER_GROUP",
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

    // Add creator as a member
    const { error: creatorError } = await supabaseAdmin
      .from("user_group_member")
      .insert({
        user_group_id: groupData.id,
        user_id: input.createdBy,
      });

    if (creatorError) {
      console.error("Failed to add creator as member:", creatorError);
    }

    revalidatePath("/dashboard");
    return { success: true, data: formatUserGroup(groupData) };
  } catch (err) {
    console.error("Unexpected error in createUserGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Validate that the given user group IDs exist and user has access to them
 */
export const validateUserGroups = async (
  groupIds: string[],
): Promise<Result<{ valid: string[]; invalid: string[] }>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Session validated - proceed to check accessible groups
    // Get groups the user has access to (created or member)
    const accessibleResult = await getAccessibleUserGroups();

    if (!accessibleResult.success || !accessibleResult.data) {
      return { success: false, error: "Failed to validate user groups" };
    }

    const accessibleIds = new Set(accessibleResult.data.map((g) => g.id));

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const groupId of groupIds) {
      if (accessibleIds.has(groupId)) {
        valid.push(groupId);
      } else {
        invalid.push(groupId);
      }
    }

    return { success: true, data: { valid, invalid } };
  } catch (err) {
    console.error("Unexpected error in validateUserGroups:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

interface UserGroupMemberRow {
  user_id: string;
  user: { id: string; email: string; name: string } | null;
}

/**
 * Get members of a user group
 */
export const getUserGroupMembers = async (
  groupId: string,
): Promise<Result<Array<{ userId: string; email: string; name: string }>>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    const { data: members, error } = await supabaseAdmin
      .from("user_group_member")
      .select(
        `
        user_id,
        user:user_id (id, email, name)
      `,
      )
      .eq("user_group_id", groupId);

    if (error) {
      console.error("Error fetching group members:", error);
      return { success: false, error: "Failed to fetch group members" };
    }

    const result = ((members || []) as unknown as UserGroupMemberRow[]).map(
      (m) => ({
        userId: m.user_id,
        email: m.user?.email || "",
        name: m.user?.name || "",
      }),
    );

    return { success: true, data: result };
  } catch (err) {
    console.error("Unexpected error in getUserGroupMembers:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Add members to an existing user group
 */
export const addMembersToUserGroup = async (
  groupId: string,
  memberEmails: string[],
): Promise<Result<{ added: string[]; failed: string[] }>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Verify user owns the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("user_group")
      .select("*")
      .eq("id", groupId)
      .eq("created_by", session.user.id)
      .single();

    if (groupError || !group) {
      return { success: false, error: "Group not found or access denied" };
    }

    // Resolve emails to user IDs
    const { data: users, error: usersError } = await supabaseAdmin
      .from("user")
      .select("id, email")
      .in("email", memberEmails);

    if (usersError) {
      console.error("Error resolving user emails:", usersError);
      return { success: false, error: "Failed to resolve emails" };
    }

    const added: string[] = [];
    const failed: string[] = [];

    if (users && users.length > 0) {
      // Check existing members
      const { data: existingMembers } = await supabaseAdmin
        .from("user_group_member")
        .select("user_id")
        .eq("user_group_id", groupId);

      const existingIds = new Set(existingMembers?.map((m) => m.user_id) || []);

      const newMembers = users.filter((u) => !existingIds.has(u.id));

      if (newMembers.length > 0) {
        const memberInserts = newMembers.map((user) => ({
          user_group_id: groupId,
          user_id: user.id,
        }));

        const { error: memberError } = await supabaseAdmin
          .from("user_group_member")
          .insert(memberInserts);

        if (memberError) {
          console.error("Failed to add members:", memberError);
          failed.push(...newMembers.map((u) => u.email));
        } else {
          added.push(...newMembers.map((u) => u.email));

          // Notify added members
          await notifyUserGroupAction(
            newMembers.map((u) => u.id),
            "ADDED_TO_USER_GROUP",
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

    // Track emails that didn't resolve
    const resolvedEmails = new Set(users?.map((u) => u.email) || []);
    memberEmails.forEach((email) => {
      if (!resolvedEmails.has(email)) {
        failed.push(email);
      }
    });

    revalidatePath("/dashboard");
    return { success: true, data: { added, failed } };
  } catch (err) {
    console.error("Unexpected error in addMembersToUserGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};

/**
 * Remove a member from a user group
 */
export const removeMemberFromUserGroup = async (
  groupId: string,
  memberUserId: string,
): Promise<Result<null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Invalid session" };
    }

    // Verify user owns the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("user_group")
      .select("*")
      .eq("id", groupId)
      .eq("created_by", session.user.id)
      .single();

    if (groupError || !group) {
      return { success: false, error: "Group not found or access denied" };
    }

    // Cannot remove owner from their own group
    if (memberUserId === session.user.id) {
      return { success: false, error: "Cannot remove yourself from the group" };
    }

    const { error } = await supabaseAdmin
      .from("user_group_member")
      .delete()
      .eq("user_group_id", groupId)
      .eq("user_id", memberUserId);

    if (error) {
      console.error("Error removing member:", error);
      return { success: false, error: "Failed to remove member" };
    }

    // Notify removed member
    await notifyUserGroupAction(
      [memberUserId],
      "REMOVED_FROM_USER_GROUP",
      groupId,
      group.name,
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in removeMemberFromUserGroup:", err);
    return { success: false, error: "Internal Server Error" };
  }
};
