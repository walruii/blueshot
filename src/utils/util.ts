import { EventDB, Event } from "../types/eventTypes";

export const formatLocalDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const compareDates = (date1: Date, date2: Date) => {
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  else return 0;
};

export const dotColor = {
  "Not Started": "#ff6b6b", // Soft Coral Red (visible but not an "alert" error)
  "On Going": "#ffd93d", // Golden Yellow (bright and distinct)
  Done: "#6bc17d", // Pastel Mint Green (clean and soothing)
};

export const timeToTimestamp = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date.getTime());
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
};

export const timeToDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date.getTime());
  next.setHours(hours, minutes, 0, 0);
  return next;
};

export const dateToTimeString = (date: Date): string => {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const sortEvents = (a: Event, b: Event) => {
  const timeA = a.from ? a.from.getTime() : Infinity;
  const timeB = b.from ? b.from.getTime() : Infinity;

  return timeA - timeB;
};

export const DBEventToEvent = (item: EventDB): Event => {
  return {
    id: item.id,
    userId: item.user_id,
    description: item.description,
    title: item.title,
    date: new Date(item.date),
    from: new Date(item.from),
    to: item.to ? new Date(item.to) : null,
  };
};
