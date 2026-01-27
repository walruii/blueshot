import DotIcon from "../svgs/DotIcon";
import { TEvent } from "../types/eventTypes";
import { dotColor } from "../utils/util";

export default function CalenderToolTip({ events }: { events: TEvent[] }) {
  return (
    <>
      <div className="cal-tooltip" id={`cal-tooltip`} hidden={true}>
        {events.slice(0, 3).map((e) => (
          <div key={e.id} className="tooltip-listitem">
            <DotIcon size={10} color={dotColor[e.status]} /> <p>{e.title}</p>
          </div>
        ))}
      </div>
    </>
  );
}
