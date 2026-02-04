import { TEvent } from "../../types/eventTypes";
import { dateToTimeString } from "../../utils/util";

export default function Event({ e }: { e: TEvent }) {
  return (
    <div
      key={e.id}
      className="border-b flex flex-col py-3 px-7 border-zinc-600"
    >
      <p className="block">{e.title} dssfd</p>
      <p className="text-sm">created by: someone</p>
      <div className="flex gap-5 w-full pt-4">
        {e.startTime && (
          <p className="bg-blue-800 p-1 px-2 rounded-md">
            from: {dateToTimeString(e.startTime)}
          </p>
        )}
        {e.endTime && (
          <p className="bg-blue-800 p-1 px-2 rounded-md">
            to: {dateToTimeString(e.endTime)}
          </p>
        )}
        <button className="bg-blue-700 rounded-lg ml-auto w-20 p-1">
          view
        </button>
      </div>
    </div>
  );
}
