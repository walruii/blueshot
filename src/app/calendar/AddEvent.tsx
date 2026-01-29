import { useState } from "react";
import { TEvent, TEventDB, TEventMap } from "../types/eventTypes";
import { useAlert } from "../alert/AlertProvider";
import {
  compareDates,
  formatLocalDate,
  timeToDateTime,
  timeToTimestamp,
  uid,
} from "../utils/util";
import supabase from "../../utils/supabase";
import { TTime } from "../types/timetype";

export default function AddEvent({
  selectedDate,
  setSelectedDate,
  setEvents,
}: {
  selectedDate: Date;
  setSelectedDate: (value: any) => void;
  setEvents: React.Dispatch<React.SetStateAction<TEventMap | null>>;
}) {
  const [title, setTitle] = useState<string>("");
  const [time, setTime] = useState<TTime>({ startTime: "", endTime: "" });

  const { showAlert } = useAlert();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length === 0 || !title) {
      showAlert({
        title: "The title can not be empty",
        type: "warning",
        description: "",
      });
      return;
    }
    if (compareDates(selectedDate, new Date()) === -1) {
      showAlert({
        title: "Selected Date is in the past",
        type: "warning",
        description: "Can not add Event in the past",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          title,
          status: "Not Started",
          date: selectedDate.toDateString(),
          start_time: time.startTime
            ? timeToTimestamp(selectedDate, time.startTime)
            : null,
          end_time: time.endTime
            ? timeToTimestamp(selectedDate, time.endTime)
            : null,
        })
        .select("id")
        .single();

      if (error || !data.id) {
        console.log("heel");
        showAlert({
          title: "Something went Wrong",
          type: "error",
          description: "I dont even know bruh",
        });
        return;
      }

      const newEvent: TEvent = {
        id: data.id,
        title,
        status: "Not Started",
        startTime: time.startTime
          ? timeToDateTime(selectedDate, time.startTime)
          : null,
        endTime: time.endTime
          ? timeToDateTime(selectedDate, time.endTime)
          : null,
      };

      setEvents((prevMap: TEventMap | null) => {
        let newMap = new Map(prevMap);

        const dateKey = selectedDate.toDateString();

        const dayEvents = newMap.get(dateKey) || [];

        newMap.set(dateKey, [...dayEvents, newEvent]);
        return newMap;
      });
      showAlert({
        title: "Event added Successfully",
        type: "info",
        description: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime((prev) => {
      return {
        ...prev,
        [e.target.name]: e.target.value,
      };
    });
  };

  return (
    <form className="add-event">
      <p>Add Event</p>
      <label>title</label>
      <input
        name="title"
        className="add-event__input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label>date</label>
      <input
        name="date"
        className="add-event__input"
        type="date"
        value={formatLocalDate(selectedDate)}
        onChange={(e) => handleSelectDate(e)}
      />
      <label>start time</label>
      <input
        name="startTime"
        className="add-event_input"
        type="time"
        value={time.startTime}
        onChange={(e) => handleTimeChange(e)}
      />
      {time.startTime && (
        <>
          <label>end time</label>
          <input
            name="endTime"
            className="add-event_input"
            type="time"
            value={time.endTime}
            onChange={(e) => handleTimeChange(e)}
          />
        </>
      )}
      <button className="btn" onClick={(e) => handleAdd(e)}>
        Add
      </button>
    </form>
  );
}
