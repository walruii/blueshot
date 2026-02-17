"use client";
import { Notification } from "@/types/notification";
import { dateToTimeString } from "@/utils/dateUtil";
import { archiveNotification } from "@/server-actions/notification";
import { useAlert } from "@/app/(alert)/AlertProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function NotificationContent({ notification }: { notification: Notification }) {
  const payload = notification.payload;

  if (payload?.type === "EVENT_ACTION") {
    const isNewEvent = notification.type === "NEW_EVENT";
    return (
      <div className="flex flex-col gap-1 p-1 px-7 py-2">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-muted-foreground">
          By {payload.eventUserName} ({payload.eventEmail})
        </p>
        {isNewEvent && (
          <Link
            href={`/app/event/${payload.eventId}`}
            className="text-sm text-primary hover:underline"
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
        <p className="text-sm text-muted-foreground">
          Group: {payload.eventGroupName}
        </p>
        <p className="text-sm text-muted-foreground">
          By {payload.eventGroupOwnerName}
        </p>
      </div>
    );
  }

  if (payload?.type === "USER_GROUP_ACTION") {
    return (
      <div className="flex flex-col gap-1 p-1 px-7 py-2">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-muted-foreground">
          Group: {payload.userGroupName}
        </p>
        <p className="text-sm text-muted-foreground">
          By {payload.userGroupOwnerName}
        </p>
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
    <div className="flex flex-col py-3 w-full justify-between items-center overflow-y-auto h-full min-h-0">
      {notifications.length === 0 && (
        <p className="text-muted-foreground p-4">No notifications</p>
      )}
      {notifications.map((n: Notification) => (
        <div
          key={n.id}
          className="flex w-full border-b items-center justify-between py-2"
        >
          <NotificationContent notification={n} />
          <div className="flex flex-col w-40 border-l px-3 py-2 min-w-40 gap-1">
            <p className="text-sm text-muted-foreground">
              {dateToTimeString(new Date(n.createdAt))}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(n.createdAt).toDateString()}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleArchive(n.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="size-4" />
              Archive
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
