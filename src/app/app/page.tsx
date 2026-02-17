import { Suspense } from "react";
import LoadingGrid from "../(loading)/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveEvents } from "@/server-actions/activeEvents";
import { getNotifications } from "@/server-actions/notification";
import UserIcon from "@/svgs/UserIcon";
import Link from "next/link";
import NotificationList from "./(notif)/NotificationList";
import UpcomingEventList from "./(notif)/UpcomingEventList";

export default function Home() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <DashboardWrapper />
    </Suspense>
  );
}

async function DashboardWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/signin");
  const notifications = await getNotifications();
  const activeEvents = await getActiveEvents();

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 max-w-500 mx-auto">
      {/* Welcome Section */}
      <div className="pb-7 pt-4 bg-zinc-900 rounded-xl h-full">
        <p className="font-bold pb-3 px-5 text-3xl">
          Welcome! {session.user.name}
        </p>
        <div className="p-6 flex flex-col sm:flex-row">
          <div className="flex justify-center items-center rounded-full overflow-clip h-25 w-25">
            <UserIcon />
          </div>
          <div className="px-2">
            <p>Hope you are doing fantastic today!</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-xl">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/calendar"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition"
          >
            View Calendar
          </Link>
          <Link
            href="/app/calendar/new"
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg text-center transition"
          >
            Add Event
          </Link>
          <Link
            href="/app/groups/user"
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg text-center transition"
          >
            User Groups
          </Link>
          <Link
            href="/app/groups/event"
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg text-center transition"
          >
            Event Groups
          </Link>
        </div>
      </div>

      {/* Notifications & Upcoming Events - Full Width */}
      <div className="bg-zinc-900 rounded-xl h-96 flex flex-col">
        <div className="border-b border-zinc-600">
          <h2 className="font-bold text-xl p-6">Notifications</h2>
        </div>
        <NotificationList notifications={notifications} />
      </div>
      <div className="bg-zinc-900 rounded-xl h-96 flex flex-col">
        <div className="border-b border-zinc-600">
          <h2 className="font-bold text-xl p-6">Upcoming Events</h2>
        </div>
        <UpcomingEventList activeEvents={activeEvents} />
      </div>
    </div>
  );
}
