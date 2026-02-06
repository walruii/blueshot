import Link from "next/link";
import { Event as TEvent } from "../../types/eventTypes";
import { dateToTimeString } from "../../utils/util";

export default function Event({ e }: { e: TEvent }) {
  return (
    <div
      key={e.id}
      className="border-b flex flex-col py-3 px-7 border-zinc-600"
    >
      <p className="block">{e.title} dssfd</p>
      <p className="text-sm">created by: </p>
      <div className="flex gap-5 w-full pt-4">
        {e.from && (
          <p className="bg-blue-800 p-1 px-2 rounded-md">
            from: {dateToTimeString(e.from)}
          </p>
        )}
        {e.to && (
          <p className="bg-blue-800 p-1 px-2 rounded-md">
            to: {dateToTimeString(e.to)}
          </p>
        )}
        <Link
          href={`/dashboard/events/${e.id}`}
          className="bg-blue-700 rounded-lg ml-auto w-20 p-1 text-center hover:bg-blue-600 active:bg-blue-800"
        >
          view
        </Link>
      </div>
    </div>
  );
}
