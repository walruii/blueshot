import { Database } from "./database.types";
import { PermissionEntry } from "./permission";

export type Event = {
  id: string;
  title: string;
  description: string;
  type: "allday" | "default";
  status: "cancel" | "archive" | "default";
  eventGroupId: string;
  createdBy: string;
  from: Date;
  to: Date | null;
  eventUserName: string;
  eventUserEmail: string;
};

export type EventInput = {
  title: string;
  description: string;
  createdBy: string; // user's id
  eventGroupId: string; // event group id
  from: Date;
  to: Date | null;
  type: "allday" | "default";
  permissions: PermissionEntry[]; // per-event permissions
};

export type EventDB =
  Database["public"]["Functions"]["get_event"]["Returns"]["0"];

export type EventMap = Map<string, Event[]>;

/**
 * Convert database event to domain event
 * Transforms ISO string dates to Date objects
 */
export const formatEvent = (dbEvent: EventDB): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  createdBy: dbEvent.created_by,
  from: new Date(dbEvent.from),
  to: dbEvent.to ? new Date(dbEvent.to) : null,
  type: dbEvent.type,
  status: dbEvent.status,
  eventGroupId: dbEvent.event_group_id,
  eventUserName: dbEvent.event_user_name,
  eventUserEmail: dbEvent.event_user_email,
});

/**
 * Convert array of database events to domain events
 */
export const formatEvents = (dbEvents: EventDB[]): Event[] =>
  dbEvents.map(formatEvent);

/*
 * Convert array of EventsDB to a EventMap
 */
export const formatEventMap = (events: EventDB[]): EventMap => {
  const newMap: EventMap = new Map();
  events.forEach((item: EventDB) => {
    const existing = newMap.get(new Date(item.from).toDateString()) || [];

    newMap.set(new Date(item.from).toDateString(), [
      ...existing,
      formatEvent(item),
    ]);
  });
  return newMap;
};
