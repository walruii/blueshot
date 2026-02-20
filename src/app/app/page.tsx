import { Suspense } from "react";
import LoadingGrid from "../../components/loading/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveEvents } from "@/server-actions/activeEvents";
import { getNotifications } from "@/server-actions/notification";
import UserIcon from "@/svgs/UserIcon";
import Link from "next/link";
import NotificationList from "./_components/NotificationList";
import UpcomingEventList from "./_components/UpcomingEventList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, FolderOpen } from "lucide-react";
import Image from "next/image";

export default function Page() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/signin");
  const notifications = await getNotifications();
  const activeEvents = await getActiveEvents();

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 max-w-500 mx-auto px-4">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Welcome! {session.user.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex justify-center items-center rounded-full overflow-clip h-20 w-20 bg-muted shrink-0">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="flex items-center">
            <p className="text-muted-foreground">
              Hope you are doing fantastic today!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="h-auto py-3">
              <Link href="/app/calendar" className="flex items-center gap-2">
                <Calendar className="size-4" />
                View Calendar
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-3">
              <Link
                href="/app/calendar/new"
                className="flex items-center gap-2"
              >
                <Plus className="size-4" />
                Add Event
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-3">
              <Link href="/app/groups/user" className="flex items-center gap-2">
                <Users className="size-4" />
                User Groups
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-3">
              <Link
                href="/app/groups/event"
                className="flex items-center gap-2"
              >
                <FolderOpen className="size-4" />
                Event Groups
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Upcoming Events - Full Width */}
      <Card className="h-96 flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <NotificationList notifications={notifications} />
      </Card>
      <Card className="h-96 flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <UpcomingEventList activeEvents={activeEvents} />
      </Card>
    </div>
  );
}
