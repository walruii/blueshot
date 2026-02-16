import { RoleValue } from "./permission";

export type EventGroupAccessDB = {
  id: string;
  event_group_id: string;
  user_id: string | null;
  user_group_id: string | null;
  role: number;
};

export type EventGroupAccess = {
  id: string;
  eventGroupId: string;
  userId: string | null;
  userGroupId: string | null;
  role: RoleValue;
};

// export const formatEventGroup = (
//   dbEventGroupAccess: EventGroupAccessDB,
// ) => ({});
