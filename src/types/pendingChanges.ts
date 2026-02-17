import { RoleValue } from "./permission";

// Types of changes that can be made to group access
export type ChangeType =
  | "add-user"
  | "add-user-group"
  | "remove-user"
  | "remove-user-group"
  | "update-user-role"
  | "update-user-group-role";

// Base change interface
interface BaseChange {
  id: string; // Unique ID for this change (for React keys and removal)
  type: ChangeType;
}

// Add a user by email
export interface AddUserChange extends BaseChange {
  type: "add-user";
  email: string;
  userId: string;
  name: string;
  role: RoleValue;
}

// Add a user group
export interface AddUserGroupChange extends BaseChange {
  type: "add-user-group";
  userGroupId: string;
  name: string;
  role: RoleValue;
}

// Remove a user
export interface RemoveUserChange extends BaseChange {
  type: "remove-user";
  userId: string;
  email: string;
}

// Remove a user group
export interface RemoveUserGroupChange extends BaseChange {
  type: "remove-user-group";
  userGroupId: string;
  name: string;
}

// Update a user's role
export interface UpdateUserRoleChange extends BaseChange {
  type: "update-user-role";
  userId: string;
  email: string;
  oldRole: RoleValue;
  newRole: RoleValue;
}

// Update a user group's role
export interface UpdateUserGroupRoleChange extends BaseChange {
  type: "update-user-group-role";
  userGroupId: string;
  name: string;
  oldRole: RoleValue;
  newRole: RoleValue;
}

// Union type for all event group changes
export type EventGroupChange =
  | AddUserChange
  | AddUserGroupChange
  | RemoveUserChange
  | RemoveUserGroupChange
  | UpdateUserRoleChange
  | UpdateUserGroupRoleChange;

// User group changes (simpler - just add/remove members)
export type UserGroupMemberChangeType = "add-member" | "remove-member";

export interface AddMemberChange {
  id: string;
  type: "add-member";
  email: string;
  userId: string;
  name: string;
}

export interface RemoveMemberChange {
  id: string;
  type: "remove-member";
  userId: string;
  email: string;
  name: string;
}

export type UserGroupMemberChange = AddMemberChange | RemoveMemberChange;

// Result types for batch operations
export interface BatchChangeResult<T> {
  successful: T[];
  failed: { change: T; error: string }[];
}
