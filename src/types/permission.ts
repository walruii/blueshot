// Role constants matching database values
export const Role = {
  READ: 1,
  READ_WRITE: 2,
  ADMIN: 3,
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];

export const RoleLabels: Record<RoleValue, string> = {
  [Role.READ]: "Read",
  [Role.READ_WRITE]: "Read/Write",
  [Role.ADMIN]: "Admin",
};

// Type of permission entry - either an individual user (by email) or a user group
export type PermissionEntryType = "email" | "userGroup";

// Unified permission entry used in forms
export interface PermissionEntry {
  identifier: string; // email for users, UUID for user groups
  type: PermissionEntryType;
  role: RoleValue;
  name?: string; // Display name (email itself for users, group name for groups)
}

// Database-ready permission for event_access table
export interface EventAccessInsert {
  event_id: string;
  user_id: string;
  user_group_id: string | null;
  role: RoleValue;
}

// Database-ready permission for event_group_access table
export interface EventGroupAccessInsert {
  event_group_id: string;
  user_id: string | null;
  user_group_id: string | null;
  role: RoleValue;
}

// Helper to get higher role (for role precedence)
export const getHigherRole = (a: RoleValue, b: RoleValue): RoleValue => {
  return Math.max(a, b) as RoleValue;
};

// Helper to check if role allows write access
export const canWrite = (role: RoleValue): boolean => {
  return role >= Role.READ_WRITE;
};

// Helper to check if role is admin
export const isAdmin = (role: RoleValue): boolean => {
  return role === Role.ADMIN;
};
