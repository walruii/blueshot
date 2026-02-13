import { Notification } from "@/types/notification";
import { dateToTimeString } from "@/utils/dateUtil";
import CrossIcon from "@/svgs/CrossIcon";

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  return (
    <div className="flex flex-col py-3 border-zinc-600 w-full justify-between items-center overflow-y-auto h-full min-h-0">
      {notifications.map((n: Notification) => (
        <div
          key={n.id}
          className="flex w-full border-b border-zinc-600 items-center justify-between py-2"
        >
          <p className="p-1 rounded px-7 py-2">{n.title}</p>
          <div className="flex flex-col w-40 border-l px-3 py-2 border-zinc-600 min-w-40">
            <p>{dateToTimeString(new Date(n.createdAt))} </p>
            <p>{new Date(n.createdAt).toDateString()}</p>
            <button className="bg-zinc-800 hover:bg-zinc-700 active:bg-red-800 p-2 px-4 rounded-lg flex justify-center items-center">
              <CrossIcon size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
