import { EventNotification } from "@/types/notificationType";
import Link from "next/link";

export default function NotificationList({
  notifications,
}: {
  notifications: EventNotification[];
}) {
  return (
    <div className=" flex flex-col py-3 border-zinc-600 w-full justify-between items-center overflow-scroll h-full">
      {notifications.map((n: EventNotification) => (
        <div
          key={n.id}
          className="flex w-full justify-between border-b border-zinc-600 px-7 py-2 items-center"
        >
          <p>
            <span className="bg-zinc-700 p-1 rounded mr-1" title={n.userEmail}>
              {n.eventUserId}
            </span>
            added you to
            <Link
              href={`/dashboard/events/${n.eventId}`}
              className="bg-zinc-700 p-1 rounded ml-1"
            >
              {n.eventTitle}
            </Link>
          </p>
          <button className="bg-zinc-800 p-2 rounded-lg px-5 hover:bg-zinc-700 active:bg-blue-700 justify-end">
            ACK
          </button>
        </div>
      ))}
    </div>
  );
}
