import { TEvent } from "../types/eventTypes";
import { dateToTimeString } from "../utils/util";

export default function Event({
  e,
  handleDelete,
  handleStatusChange,
}: {
  e: TEvent;
  handleDelete: (id: string) => void;
  handleStatusChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    id: string,
  ) => void;
}) {
  return (
    <div key={e.id} className="event-listitem">
      <p>{e.title}</p>
      <div className="event-time">
        <div className="event-time-item">
          {e.startTime && (
            <>
              <label htmlFor="startTime">Start Time: </label>
              <p>{dateToTimeString(e.startTime)}</p>
            </>
          )}
        </div>
        <div className="event-time-item">
          {e.endTime && (
            <>
              <label htmlFor="endTime">End Time: </label>
              <p>{dateToTimeString(e.endTime)}</p>
            </>
          )}
        </div>
      </div>
      <div className="event-options">
        <div>
          <label htmlFor="status">status: </label>
          <select
            name="status"
            id="status"
            value={e.status}
            onChange={(eve) => handleStatusChange(eve, e.id)}
          >
            <option value="Not Started">Not Started</option>
            <option value="On Going">On Going</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <button className="delete-event" onClick={() => handleDelete(e.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
