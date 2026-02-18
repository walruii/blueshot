"use client";
import { useState } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type CaptionProps,
} from "react-day-picker";
import { EventMap } from "@/types/event";
import DotIcon from "@/svgs/DotIcon";
import { sortEvents } from "@/utils/dateUtil";
import EventList from "./EventList";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarView({
  dbEvents: events,
}: {
  dbEvents: EventMap;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const defaultClassNames = getDefaultClassNames();

  const CustomCaption = ({ calendarMonth }: CaptionProps) => {
    const displayMonth = calendarMonth.date;
    const currentYear = displayMonth.getFullYear();
    const currentMonthIndex = displayMonth.getMonth();

    // Generate year options (current year +/- 10 years)
    const yearOptions = Array.from(
      { length: 21 },
      (_, i) => currentYear - 10 + i,
    );

    const handleMonthChange = (value: string) => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(parseInt(value));
      setCurrentMonth(newDate);
    };

    const handleYearChange = (value: string) => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(parseInt(value));
      setCurrentMonth(newDate);
    };

    const goToPreviousMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentMonth(newDate);
    };

    const goToNextMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
    };

    return (
      <div className="flex items-center justify-between w-full h-12 mb-2 px-1">
        <button
          onClick={goToPreviousMonth}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-10 rounded-lg",
          )}
          aria-label="Go to previous month"
        >
          <ChevronLeftIcon className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <Select
            value={currentMonthIndex.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-25">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={goToNextMonth}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-10 rounded-lg",
          )}
          aria-label="Go to next month"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
    );
  };

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
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        fixedWeeks
        showOutsideDays
        className="lg:col-span-4 lg:row-span-3 w-full max-w-full rounded-2xl shadow-xl p-4 bg-card relative"
        classNames={{
          months: cn("flex flex-col w-full", defaultClassNames.months),
          month: cn(
            "flex flex-col w-full gap-2 relative",
            defaultClassNames.month,
          ),
          nav: cn(
            "flex items-center justify-between w-full hidden",
            defaultClassNames.nav,
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
          MonthCaption: CustomCaption,
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
