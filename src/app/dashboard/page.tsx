import CalendarView from "./CalendarView";
import { Suspense } from "react";
import { getEvents } from "@/server-actions/event";
import LoadingGrid from "../(loading)/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveEvents } from "@/server-actions/activeEvents";
import { getNotifications } from "@/server-actions/notification";
import UserIcon from "@/svgs/UserIcon";
import NotificationUpcomingCluster from "./(notif)/NotificationUpcomingCluster";

export default function Home() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <CalendarViewEventWrapper />
    </Suspense>
  );
}

async function CalendarViewEventWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/signin");
  const events = await getEvents();
  const notifications = await getNotifications();
  const activeEvents = await getActiveEvents();

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6 lg:grid-rows-4 h-auto lg:h-260 max-w-500 mx-auto">
      <div className="pb-7 pt-4 bg-zinc-900 rounded-xl h-full col-span-1 lg:col-span-3">
        <p className="font-bold pb-3 px-5 text-3xl">
          Welcome! {session.user.name}
        </p>
        <div className="p-6 flex flex-col sm:flex-row">
          <div className="flex justify-center items-center rounded-full overflow-clip h-25 w-25">
            <UserIcon />
            {/* <Image src="/file.svg" width={100} height={100} alt="" /> */}
          </div>
          <div className="px-2">
            <p>Hope you are doing fantastic today!</p>
          </div>
        </div>
      </div>
      <NotificationUpcomingCluster
        className="bg-zinc-900 rounded-xl h-full col-span-1 lg:col-span-3 flex flex-col"
        notifications={notifications}
        activeEvents={activeEvents}
      />
      <CalendarView dbEvents={events} />
    </div>
  );
}
