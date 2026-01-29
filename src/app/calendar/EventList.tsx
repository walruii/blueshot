import { useState } from "react";
import { useAlert } from "../alert/AlertProvider";
import { TEvent, TEventMap } from "../types/eventTypes";
import EventListFilter from "./EventListFilter";
import Event from "./Event";
import supabase from "../../utils/supabase";
import { sortEvents } from "../utils/util";

export default function EventList({
  selectedDate,
  events,
  setEvents,
}: {
  selectedDate: Date;
  events: TEventMap;
  setEvents: React.Dispatch<React.SetStateAction<TEventMap | null>>;
}) {
  const { showAlert } = useAlert();
  const [statusFilter, setStatusFilter] =
    useState<TEvent["status"]>("Not Started");

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    id: string,
  ) => {
    const st = e.target.value;
    try {
      const { data, error } = await supabase
        .from("events")
        .update({ status: st })
        .eq("id", id);

      if (error) {
        showAlert({
          title: "Status Could not be changed",
          type: "warning",
          description: "",
        });
      }

      setEvents((prevMap: TEventMap | null) => {
        let newMap = new Map(prevMap);

        const dateString = selectedDate.toDateString();
        let prevEves = newMap.get(dateString) || [];

        const updatedEves = prevEves.map((ev) => {
          if (ev.id === id) {
            return { ...ev, status: st as TEvent["status"] };
          }
          return ev;
        });
        newMap.set(dateString, updatedEves);
        return newMap;
      });
      console.log(events);
      return;
    } catch (err) {
      showAlert({
        title: "Status Could not be changed",
        type: "warning",
        description: "",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) {
        showAlert({
          title: "Something went wrong",
          type: "error",
          description: "",
        });
        return;
      }
      setEvents((prevMap) => {
        let newMap = new Map(prevMap);

        const dateString = selectedDate.toDateString();

        let events = newMap.get(dateString) || [];

        events = events.filter((e) => String(e.id) !== String(id));
        newMap.set(dateString, events);
        console.log(newMap.get(dateString));
        return newMap;
      });
      showAlert({
        title: "Event Deleted Successfully",
        type: "info",
        description: "",
      });
    } catch (err) {
      console.error(err);
    }
  };
  const hasEvents = events.has(selectedDate.toDateString());
  let eves = (events.get(selectedDate.toDateString()) || [])
    .sort((a, b) => sortEvents(a, b))
    .filter((e) => e.status === statusFilter);
  return (
    <div className="event-cluster">
      <p>{selectedDate.toDateString()}</p>
      <EventListFilter
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <div className="events-box">
        {hasEvents &&
          eves.map((e) => {
            return (
              <Event
                key={e.id}
                e={e}
                handleDelete={handleDelete}
                handleStatusChange={handleStatusChange}
              />
            );
          })}
      </div>
    </div>
  );
}
