import { PermissionEntry } from "./permission";

export type EventGroupDB = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type EventGroup = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

// Input type for creating a new event group
export interface EventGroupInput {
  name: string;
  createdBy: string;
  permissions: PermissionEntry[];
}

export const formatEventGroup = (dbEventGroup: EventGroupDB): EventGroup => ({
  id: dbEventGroup.id,
  name: dbEventGroup.name,
  createdBy: dbEventGroup.created_by,
  createdAt: dbEventGroup.created_at,
});
