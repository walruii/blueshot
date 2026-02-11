import { Event } from "@/types/eventTypes";

export const formatLocalDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDateInput = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
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
