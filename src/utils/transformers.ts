/**
 * Transform functions to convert database responses to domain types
 * This layer normalizes different Supabase query shapes into consistent application types
 */

import { EventDB, Event } from "@/types/eventTypes";
import {
  EventParticipantWithUserDB,
  EventParticipant,
} from "@/types/eventParticipantType";
import {
  EventNotificationDB,
  EventNotification,
} from "@/types/notificationType";
import { Upcoming, UpcomingDB } from "@/types/upcomingType";

/**
 * Convert database event to domain event
 * Transforms ISO string dates to Date objects
 */
export const formatEvent = (dbEvent: EventDB): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  userId: dbEvent.user_id,
  date: new Date(dbEvent.date),
  from: new Date(dbEvent.from),
  to: dbEvent.to ? new Date(dbEvent.to) : null,
});

/**
 * Convert array of database events to domain events
 */
export const formatEvents = (dbEvents: EventDB[]): Event[] =>
  dbEvents.map(formatEvent);

/**
 * Convert event participant DB response (with user) to domain type
 */
export const formatEventParticipant = (
  dbParticipant: EventParticipantWithUserDB,
): EventParticipant => ({
  id: dbParticipant.id,
  userId: dbParticipant.user.id,
  userEmail: dbParticipant.user.email,
  eventId: dbParticipant.event_id,
  mailSent: dbParticipant.mail_sent,
  acknowledgement: dbParticipant.acknowledgement,
});

/**
 * Convert array of event participants to domain type
 */
export const formatEventParticipants = (
  dbParticipants: EventParticipantWithUserDB[],
): EventParticipant[] => dbParticipants.map(formatEventParticipant);

/**
 * Convert full event participant DB response (with user and event) to event notification
 */
export const formatEventNotification = (
  dbNotif: EventNotificationDB,
): EventNotification => ({
  id: dbNotif.id,
  eventId: dbNotif.event.id,
  eventTitle: dbNotif.event.title,
  eventUserId: dbNotif.event.user.id,
  eventEmail: dbNotif.event.user.email,
  eventUsername: dbNotif.event.user.name,
  mailSent: dbNotif.mail_sent,
  acknowledgement: dbNotif.acknowledgement,
});

/**
 * Convert array of event notifications to domain type
 */
export const formatEventNotifications = (
  dbNotifs: EventNotificationDB[],
): EventNotification[] => dbNotifs.map(formatEventNotification);

/**
 * Convert full Upcoming DB response (with user and event) to upcoming Event
 */
export const formatUpcomingEvent = (upcomingEvent: UpcomingDB): Upcoming => ({
  id: upcomingEvent.id,
  eventId: upcomingEvent.event.id,
  eventTitle: upcomingEvent.event.title,
  eventDate: new Date(upcomingEvent.event.date),
  eventUserId: upcomingEvent.event.user.id,
  eventUserName: upcomingEvent.event.user.name,
  eventUserEmail: upcomingEvent.event.user.email,
  eventFrom: new Date(upcomingEvent.event.from),
  eventTo: upcomingEvent.event.to ? new Date(upcomingEvent.event.to) : null,
});

/**
 * Convert array of Upcoming Events to domain type
 */
export const formatUpcomingEvents = (
  upcomingEvents: UpcomingDB[],
): Upcoming[] => upcomingEvents.map(formatUpcomingEvent);
