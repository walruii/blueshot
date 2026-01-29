import DotIcon from "../svgs/DotIcon";
import { TEvent } from "../types/eventTypes";
import { dotColor } from "../utils/util";
import { TMouse } from "../types/hoverData";
import "./calendar.css";

export default function CalendarToolTip({
  mouseLocation,
  events,
}: {
  mouseLocation: TMouse;
  events: TEvent[];
}) {
  const eves = events.sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0; // Or your custom null logic
    return a.startTime.getTime() - b.startTime.getTime();
  });
  return (
    <div
      className="cal-tooltip"
      id={`cal-tooltip`}
      style={{
        position: "fixed",
        left: mouseLocation.x + 15,
        top: mouseLocation.y + 15,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {eves.slice(0, 3).map((e) => (
        <div key={e.id} className="tooltip-listitem">
          <DotIcon size={10} color={dotColor[e.status]} /> <p>{e.title}</p>
        </div>
      ))}
    </div>
  );
}
