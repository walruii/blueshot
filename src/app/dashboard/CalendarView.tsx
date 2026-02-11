"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { EventMap } from "../../types/eventTypes";
import DotIcon from "../../svgs/DotIcon";
import { sortEvents } from "../../utils/dateUtil";
import "./Calendar.css";
import EventList from "./EventList";
import { Session } from "@/types/sessionType";
import { EventNotification } from "@/types/notificationType";
import NotificationUpcomingCluster from "./(notif)/NotificationUpcomingCluster";
import { Upcoming } from "@/types/upcomingType";
import UserIcon from "@/svgs/UserIcon";

export default function CalendarView({
  dbEvents: events,
  notifications,
  session,
  upcomingEvents,
}: {
  dbEvents: EventMap;
  notifications: EventNotification[];
  session: Session;
  upcomingEvents: Upcoming[];
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString())) return <div className=""></div>;

    const eves = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));

    if (!eves) return <div className=""></div>;

    return (
      <div className="">
        <div className="flex sm:flex-col items-start my-2">
          {eves.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-1">
              <DotIcon size={10} color={"yellow"} />
              <p className="truncate text-xs hidden sm:block">{e.title}</p>
            </div>
          ))}
        </div>
        {eves.length > 3 && (
          <div className="text-xs block">+{eves.length - 3}</div>
        )}
      </div>
    );
  };

  const handleCalendarChange = (nextValue: Date | null) => {
    if (nextValue instanceof Date) {
      setSelectedDate(nextValue);
    }
  };

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
        upcomingEvents={upcomingEvents}
      />
      <Calendar
        showFixedNumberOfWeeks={true}
        tileClassName={"h-25 flex flex-col sm:items-start p-0"}
        tileContent={renderTileContent}
        onChange={(e) => handleCalendarChange(e as Date | null)}
        value={selectedDate}
        className="h-full lg:col-span-4 lg:row-span-3"
      />
      <EventList
        selectedDate={selectedDate}
        events={events}
        className="lg:row-span-3 lg:col-span-2"
      />
    </div>
  );
}
