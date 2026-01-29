import { TEvent } from "../types/eventTypes";

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
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const timeToDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const dateToTimeString = (date: Date): string => {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
const statusWeight: Record<string, number> = {
  "On Going": 1,
  "Not Started": 2,
  Done: 3,
};

export const sortEvents = (a: TEvent, b: TEvent) => {
  // 1. Sort by status weight first
  const statusDiff =
    (statusWeight[a.status] ?? 99) - (statusWeight[b.status] ?? 99);

  if (statusDiff !== 0) return statusDiff;

  // 2. If status is the same, sort by time
  const timeA = a.startTime ? a.startTime.getTime() : Infinity;
  const timeB = b.startTime ? b.startTime.getTime() : Infinity;

  return timeA - timeB;
};
