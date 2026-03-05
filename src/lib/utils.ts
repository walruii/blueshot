import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a 6-character alphanumeric passcode for meeting access
 * @returns A random 6-character string (uppercase letters and digits)
 */
export function generateMeetingPasscode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let passcode = "";
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return passcode;
}
