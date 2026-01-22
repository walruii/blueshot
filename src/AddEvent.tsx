import { useState } from "react";
import { TEventMap } from "./eventTypes";
import { useAlert } from "./AlertProvider";

const formatLocalDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const compareDates = (date1: Date, date2: Date) => {
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  else return 0;
};

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
    const newEvent = {
      date: selectedDate.toDateString(),
      id: uid(),
      title,
      status: "Not Started",
    };

    try {
      const res = await fetch("http://localhost:5001/events", {
        method: "POST",
        body: JSON.stringify(newEvent),
      });

      if (!res.ok) {
        console.log("heel");
        showAlert({
          title: "Something went Wrong",
          type: "error",
          description: "I dont even know bruh",
        });
        return;
      }
      setEvents((prevMap: TEventMap) => {
        let newMap = new Map(prevMap);

        const dateKey = selectedDate.toDateString();

        const dayEvents = newMap.get(dateKey) || [];

        newMap.set(dateKey, [...dayEvents, newEvent]);
        return newMap;
      });
      showAlert({
        title: "Your Event added Successfully",
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
