import { Notification } from "@/types/notification";
import { dateToTimeString } from "@/utils/dateUtil";
import CrossIcon from "@/svgs/CrossIcon";
import { archiveNotification } from "@/server-actions/notification";
import { useAlert } from "@/app/(alert)/AlertProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

function NotificationContent({ notification }: { notification: Notification }) {
  const payload = notification.payload;

  if (payload?.type === "EVENT_ACTION") {
    const isNewEvent = notification.type === "NEW_EVENT";
    return (
      <div className="flex flex-col gap-1 p-1 px-7 py-2">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-zinc-400">
          By {payload.eventUserName} ({payload.eventEmail})
        </p>
        {isNewEvent && (
          <Link
            href={`/dashboard/events/${payload.eventId}`}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            View Event
          </Link>
        )}
      </div>
    );
  }

  if (payload?.type === "EVENT_GROUP_ACTION") {
    return (
      <div className="flex flex-col gap-1 p-1 px-7 py-2">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-zinc-400">Group: {payload.eventGroupName}</p>
        <p className="text-sm text-zinc-400">
          By {payload.eventGroupOwnerName}
        </p>
      </div>
    );
  }

  if (payload?.type === "USER_GROUP_ACTION") {
    return (
      <div className="flex flex-col gap-1 p-1 px-7 py-2">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-zinc-400">Group: {payload.userGroupName}</p>
        <p className="text-sm text-zinc-400">By {payload.userGroupOwnerName}</p>
      </div>
    );
  }

  // Default/SYSTEM fallback
  return <p className="p-1 rounded px-7 py-2">{notification.title}</p>;
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const handleArchive = async (id: string) => {
    const res = await archiveNotification(id);
    if (res.success) {
      router.refresh();
      showAlert({
        title: "Notification archived",
        description: "",
        type: "success",
      });
    } else {
      showAlert({
        title: res.error || "Failed to archive notification",
        description: "",
        type: "error",
      });
    }
  };
  return (
    <div className="flex flex-col py-3 border-zinc-600 w-full justify-between items-center overflow-y-auto h-full min-h-0">
      {notifications.map((n: Notification) => (
        <div
          key={n.id}
          className="flex w-full border-b border-zinc-600 items-center justify-between py-2"
        >
          <NotificationContent notification={n} />
          <div className="flex flex-col w-40 border-l px-3 py-2 border-zinc-600 min-w-40">
            <p>{dateToTimeString(new Date(n.createdAt))} </p>
            <p>{new Date(n.createdAt).toDateString()}</p>
            <button
              className="bg-zinc-800 hover:bg-zinc-700 active:bg-red-800 p-2 px-4 rounded-lg flex justify-center items-center"
              onClick={() => handleArchive(n.id)}
            >
              <CrossIcon size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
