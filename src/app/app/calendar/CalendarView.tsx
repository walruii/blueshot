"use client";
import { useState } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
} from "react-day-picker";
import { EventMap } from "@/types/event";
import DotIcon from "@/svgs/DotIcon";
import { sortEvents } from "@/utils/dateUtil";
import EventList from "./EventList";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function CalendarView({
  dbEvents: events,
}: {
  dbEvents: EventMap;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const defaultClassNames = getDefaultClassNames();

  const CustomDayButton = ({ day, modifiers, ...props }: DayButtonProps) => {
    const date = day.date;
    const dayEvents = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));
    const isSelected = modifiers.selected;
    const isToday = modifiers.today;
    const isOutside = modifiers.outside;

    return (
      <button
        {...props}
        className={cn(
          "h-full w-full min-h-24 p-1 flex flex-col items-start rounded-xl transition-all text-left",
          isSelected && "bg-primary text-primary-foreground shadow-md",
          isToday &&
            !isSelected &&
            "bg-primary/20 text-primary border border-primary/30",
          isOutside && "text-muted-foreground",
          !isSelected && !isToday && "hover:bg-accent",
        )}
      >
        <span
          className={cn(
            "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
            isSelected && "bg-primary-foreground/20",
          )}
        >
          {date.getDate()}
        </span>
        {dayEvents && dayEvents.length > 0 && (
          <div className="flex-1 w-full overflow-hidden">
            <div className="flex sm:flex-col items-start gap-0.5 mt-1">
              {dayEvents.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-1 w-full">
                  <DotIcon size={8} color="yellow" />
                  <Link
                    href={`/app/event/${e.id}`}
                    className="hover:underline flex-1 min-w-0"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <p className="truncate text-xs hidden sm:block">
                      {e.title}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
            {dayEvents.length > 3 && (
              <div className="text-xs mt-0.5">+{dayEvents.length - 3}</div>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        fixedWeeks
        showOutsideDays
        className="lg:col-span-4 lg:row-span-3 w-full max-w-full rounded-2xl shadow-xl p-4 bg-card relative"
        classNames={{
          months: cn("flex flex-col w-full", defaultClassNames.months),
          month: cn(
            "flex flex-col w-full gap-2 relative",
            defaultClassNames.month,
          ),
          month_caption: cn(
            "flex items-center justify-center h-12 mb-2 px-1",
            defaultClassNames.month_caption,
          ),
          caption_label: cn(
            "text-lg font-bold",
            defaultClassNames.caption_label,
          ),
          nav: cn(
            "flex items-center justify-between w-full absolute inset-x-0 top-0",
            defaultClassNames.nav,
          ),
          button_previous: cn(
            buttonVariants({ variant: "ghost" }),
            "size-10 rounded-lg",
            defaultClassNames.button_previous,
          ),
          button_next: cn(
            buttonVariants({ variant: "ghost" }),
            "size-10 rounded-lg",
            defaultClassNames.button_next,
          ),
          weekdays: cn("flex w-full", defaultClassNames.weekdays),
          weekday: cn(
            "flex-1 text-center uppercase font-bold text-xs p-2 text-foreground",
            defaultClassNames.weekday,
          ),
          week: cn("flex w-full", defaultClassNames.week),
          day: cn("flex-1 p-0.5", defaultClassNames.day),
          outside: cn("text-muted-foreground", defaultClassNames.outside),
          today: cn("", defaultClassNames.today),
          selected: cn("", defaultClassNames.selected),
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? (
              <ChevronLeftIcon className="size-5" />
            ) : (
              <ChevronRightIcon className="size-5" />
            ),
          DayButton: CustomDayButton,
        }}
      />
      <EventList
        selectedDate={selectedDate}
        events={events}
        className="lg:row-span-3 lg:col-span-2"
      />
    </>
  );
}
