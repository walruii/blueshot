"use client";

import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeetingState = "notAvailable" | "available" | "ended";

export const MeetingLink = ({ event }: { event: Event }) => {
  const [meetingState, setMeetingState] =
    useState<MeetingState>("notAvailable");
  const [disabled, setDisabled] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMeetingState = () => {
      if (!event.eventMeetingId || !event.from) return "notAvailable";

      const now = new Date();
      const eventStart = new Date(event.from);

      // --- CASE 1: ALL DAY EVENT (event.to is null) ---
      if (!event.to) {
        // Check if today is the same calendar day as eventStart
        const isToday = now.toDateString() === eventStart.toDateString();
        const isPast =
          now.setHours(0, 0, 0, 0) > eventStart.setHours(0, 0, 0, 0);

        if (isToday) return "available";
        if (isPast) return "ended";
        return "notAvailable";
      }

      // --- CASE 2: TIMED EVENT (event.to exists) ---
      const eventEnd = new Date(event.to);

      if (now > eventEnd) return "ended";

      // Available if: Now is between (Start - 10 mins) and End
      const isWithinWindow =
        now >= new Date(eventStart.getTime() - 10 * 60 * 1000) &&
        now <= eventEnd;

      return isWithinWindow ? "available" : "notAvailable";
    };

    const updateState = () => {
      const state = checkMeetingState();
      setMeetingState(state);
      setDisabled(state !== "available");
    };

    updateState(); // Run immediately

    const interval = setInterval(updateState, 30 * 1000); // Check every 30s for better accuracy
    return () => clearInterval(interval);
  }, [event.eventMeetingId, event.from, event.to]);

  const handleClick = () => {
    if (meetingState !== "available") return;
    router.push(`/app/meeting/${event.eventMeetingId}`);
  };

  let buttonText = "";

  if (meetingState === "notAvailable") {
    buttonText = "Meeting link available 10 mins before start";
  } else if (meetingState === "available") {
    buttonText = "Join Meeting";
  } else {
    buttonText = "Event ended";
  }

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={handleClick}
      className="w-fit"
    >
      {buttonText}
    </Button>
  );
};
