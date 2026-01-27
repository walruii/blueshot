import { useState } from "react";
import { TEventDB, TEventMap } from "../types/eventTypes";
import { useAlert } from "../alert/AlertProvider";
import { compareDates, formatLocalDate, uid } from "../utils/util";
import supabase from "../../utils/supabase";

export default function AddEvent({
  selectedDate,
  setSelectedDate,
  setEvents,
}: {
  selectedDate: Date;
  setSelectedDate: (value: any) => void;
  setEvents: React.Dispatch<React.SetStateAction<TEventMap>>;
}) {
  const [title, setTitle] = useState("");

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

      const newEvent: TEventDB = {
        date: selectedDate.toDateString(),
        id: data.id,
        title,
        status: "Not Started",
      };

      setEvents((prevMap: TEventMap) => {
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

  return (
    <form className="add-event">
      <p>Add Event</p>
      <label>title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)}></input>
      <label>date</label>
      <input
        type="date"
        value={formatLocalDate(selectedDate)}
        onChange={(e) => handleSelectDate(e)}
      ></input>
      <button onClick={(e) => handleAdd(e)}>Add</button>
    </form>
  );
}
