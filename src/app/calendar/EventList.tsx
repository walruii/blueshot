import { useState } from "react";
import { useAlert } from "../alert/AlertProvider";
import { TEvent, TEventMap } from "../types/eventTypes";
import EventListFilter from "./EventListFilter";
import Event from "./Event";

export default function EventList({
  selectedDate,
  events,
  setEvents,
}: {
  selectedDate: Date;
  events: TEventMap;
  setEvents: React.Dispatch<React.SetStateAction<TEventMap>>;
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
      const res = await fetch(`http://localhost:5001/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: e.target.value }),
      });

      if (!res.ok) {
        showAlert({
          title: "Status Could not be changed",
          type: "warning",
          description: "",
        });
        return;
      }
      setEvents((prevMap: TEventMap) => {
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
    } catch (err) {}
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
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
  let eves = events.get(selectedDate.toDateString()) || [];
  eves = eves.filter((e) => e.status === statusFilter);
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
