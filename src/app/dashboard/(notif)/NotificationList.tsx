import { EventNotification } from "@/types/notificationType";
import Link from "next/link";
import AcknowledgementButton from "../AcknowledgementButton";

export default function NotificationList({
  notifications,
}: {
  notifications: EventNotification[];
}) {
  return (
    <div className="flex flex-col py-3 border-zinc-600 w-full justify-between items-center overflow-y-auto min-h-0 h-full">
      {notifications.map((n: EventNotification) => (
        <div
          key={n.id}
          className="flex w-full justify-between border-b border-zinc-600 px-7 py-2 items-center"
        >
          <p>
            <span className="bg-zinc-700 p-1 rounded mr-1" title={n.eventEmail}>
              {n.eventUsername}
            </span>
            added you to
            <Link
              href={`/dashboard/events/${n.eventId}`}
              className="hover:bg-zinc-700 p-1 rounded ml-1"
            >
              {n.eventTitle}
            </Link>
          </p>
          <AcknowledgementButton eventParticipateId={n.id} />
        </div>
      ))}
    </div>
  );
}
