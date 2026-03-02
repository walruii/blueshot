export function isMeetingDebug(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any).__MEETING_DEBUG === true;
}
