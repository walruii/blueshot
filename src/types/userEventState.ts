import { Database } from "./database.types";

export type EventMember = {
  acknowledgedAt: Date | null;
  createdAt: Date;
  eventId: string;
  eventSentAt: Date | null;
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
};

export type UserEventState = {
  acknowledgedAt: Date | null;
  createdAt: Date;
  eventId: string;
  eventSentAt: Date | null;
  id: string;
  userId: string;
};

export type EventMemberDB =
  Database["public"]["Functions"]["get_event_members"]["Returns"]["0"];

export type UserEventStateDB =
  Database["public"]["Tables"]["event_user_state"]["Row"];

export const formatUserEventState = (
  uesDB: UserEventStateDB,
): UserEventState => ({
  acknowledgedAt: uesDB.acknowledged_at
    ? new Date(uesDB.acknowledged_at)
    : null,
  createdAt: new Date(uesDB.created_at),
  eventId: uesDB.event_id,
  eventSentAt: uesDB.event_sent_at ? new Date(uesDB.event_sent_at) : null,
  id: uesDB.id,
  userId: uesDB.user_id,
});

export const formatUserEventStates = (
  uesDBA: UserEventStateDB[],
): UserEventState[] => uesDBA.map((e) => formatUserEventState(e));

export const formatEventMember = (uesDB: EventMemberDB): EventMember => ({
  acknowledgedAt: uesDB.acknowledged_at
    ? new Date(uesDB.acknowledged_at)
    : null,
  createdAt: new Date(uesDB.created_at),
  eventId: uesDB.event_id,
  eventSentAt: uesDB.event_sent_at ? new Date(uesDB.event_sent_at) : null,
  id: uesDB.id,
  userId: uesDB.user_id,
  userName: uesDB.user_name,
  userEmail: uesDB.user_email,
});

export const formatEventMembers = (uesDBA: EventMemberDB[]): EventMember[] =>
  uesDBA.map((e) => formatEventMember(e));
