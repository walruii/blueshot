import { Database } from "./database.types";

export type NotificationDB =
  Database["public"]["Tables"]["notifications"]["Row"];

export type Notification = {
  archived: Date | null;
  createdAt: string;
  id: string;
  payload: NotificationJSON;
  priority: number;
  title: string;
  type: string;
};
export type NotificationJSON =
  | ({ type: "EVENT_ACTION" } & {
      eventId: string;
      eventTitle: string;
      eventUserName: string;
      eventEmail: string;
      eventFrom: string;
      eventTo: string | null;
    })
  | ({ type: "EVENT_GROUP_ACTION" } & {
      eventGroupId: string;
      eventGroupName: string;
      eventGroupOwner: string;
      eventGroupOwnerName: string;
      eventGroupOwnerEmail: string;
    })
  | ({ type: "USER_GROUP_ACTION" } & {
      userGroupId: string;
      userGroupName: string;
      userGroupOwner: string;
      userGroupOwnerName: string;
      userGroupOwnerEmail: string;
    })
  | ({ type: "SYSTEM" } & null);

export const formatNotification = (dbRow: NotificationDB): Notification => {
  return {
    id: dbRow.id,
    title: dbRow.title,
    createdAt: dbRow.created_at, // Mapping snake_case to camelCase
    priority: dbRow.priority,
    type: dbRow.type,
    // Convert string timestamp to Date object if it exists
    archived: dbRow.archived ? new Date(dbRow.archived) : null,
    // Cast the generic JSON to our specific Union Type
    payload: dbRow.payload as unknown as NotificationJSON,
  };
};
