"use client";
import { EventMap } from "@/types/event";
import Event from "./Event";
import { formatLocalDate, sortEvents } from "@/utils/dateUtil";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EventList({
  selectedDate,
  events,
  className,
}: {
  selectedDate: Date;
  className?: string;
  events: EventMap;
}) {
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = (events.get(selectedDate.toDateString()) || []).sort((a, b) =>
    sortEvents(a, b),
  );
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLink = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate >= today) {
      router.push(
        `/app/calendar/new?prefillDate=${formatLocalDate(selectedDate)}`,
      );
    } else {
      showAlert({
        title: "Can not Add Event in the past!",
        type: "warning",
        description: "",
      });
    }
  };
  return (
    <div
      className={`py-7 bg-card rounded-xl h-full min-h-0 flex flex-col ${className}`}
    >
      <div className="font-bold pb-3 px-5 flex justify-between items-center">
        <p>{selectedDate.toDateString()}</p>
        <Button onClick={() => handleLink()} variant="secondary" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </div>
      <div className="overflow-y-auto border-t border-border flex-1 min-h-0">
        {hasEvents &&
          eves.map((e) => {
            return <Event key={e.id} e={e} />;
          })}
      </div>
    </div>
  );
}
