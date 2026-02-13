"use client";
import { useState } from "react";
import NotificationList from "./NotificationList";
import UpcomingEventList from "./UpcomingEventList";
import { Event } from "@/types/event";
import { Notification } from "@/types/notification";

export default function NotificationUpcomingCluster({
  className,
  notifications,
  activeEvents,
}: {
  className?: string;
  notifications: Notification[];
  activeEvents: Event[];
}) {
  const [selectedCluster, setCluster] = useState<"notification" | "upcoming">(
    "notification",
  );
  return (
    <div className={`${className} max-h-100`}>
      <div className="border-b border-zinc-600 flex justify-around">
        <button
          onClick={() => setCluster("notification")}
          className={`rounded-tl-xl font-bold pb-3 px-5 w-full pt-7 ${selectedCluster === "notification" ? "bg-blue-700 hover:bg-blue-800" : "hover:bg-zinc-800"}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setCluster("upcoming")}
          className={`rounded-tr-xl font-bold pb-3 px-5 w-full pt-7 ${selectedCluster === "upcoming" ? "bg-blue-700 hover:bg-blue-800" : "hover:bg-zinc-800"}`}
        >
          Upcoming
        </button>
      </div>
      {selectedCluster === "notification" ? (
        <NotificationList notifications={notifications} />
      ) : (
        <UpcomingEventList activeEvents={activeEvents} />
      )}
    </div>
  );
}
