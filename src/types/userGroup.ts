export type UserGroupDB = {
  id: string;
  name: string;
  created_by: string;
  created_at?: string;
};

export type UserGroup = {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: string;
};

// Input type for creating a new user group
export interface UserGroupInput {
  name: string;
  createdBy: string;
  memberEmails: string[];
}

export const formatUserGroup = (dbUserGroup: UserGroupDB): UserGroup => ({
  id: dbUserGroup.id,
  name: dbUserGroup.name,
  createdBy: dbUserGroup.created_by,
  createdAt: dbUserGroup.created_at,
});
