import { useAlert } from "./AlertProvider";
import { TEventMap } from "./eventTypes";

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
  const handledelete = async (id: string) => {
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
  const eves = events.get(selectedDate.toDateString()) || [];
  return (
    <div className="event-cluster">
      <p>{selectedDate.toDateString()}</p>
      <hr />
      <div className="events-box">
        {hasEvents &&
          eves.map((e) => {
            return (
              <div key={e.id} className="event-listitem">
                <p>{e.title}</p>
                <p>{e.status}</p>
                <button
                  className="delete-event"
                  onClick={() => handledelete(e.id)}
                >
                  delete
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
