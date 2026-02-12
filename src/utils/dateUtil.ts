import { Event } from "@/types/event";

export const formatLocalDateTime = (
  dateObj: Date,
  hours: number = 0,
  minutes: number = 0,
) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${h}:${m}`;
};

export const formatLocalDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
export const parseLocalDateInput = (str: string): Date => {
  const [dateStr, timeStr] = str.split("T").map(String);
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
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
