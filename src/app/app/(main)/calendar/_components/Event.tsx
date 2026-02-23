import Link from "next/link";
import { Event as TEvent } from "@/types/event";
import { dateToTimeString } from "@/utils/dateUtil";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetingLink } from "@/app/app/_components/MeetingLink";

export default function Event({ e }: { e: TEvent }) {
  return (
    <div key={e.id} className="border-b flex flex-col py-3 px-7 border-border">
      <p className="block">{e.title}</p>
      <p className="text-sm text-muted-foreground" title={e.eventUserEmail}>
        created by: {e.eventUserName}
      </p>
      <div className="flex gap-3 w-full pt-4 flex-wrap items-center">
        <Badge variant="secondary">from: {dateToTimeString(e.from)}</Badge>
        {e.to && (
          <Badge variant="secondary">
            to: {dateToTimeString(e.to)}
            {e.to.toDateString() != e.from.toDateString() && (
              <span>, {e.to.toDateString()}</span>
            )}
          </Badge>
        )}
        <div className="ml-auto">
          {e.eventMeetingId && <MeetingLink event={e} />}
        </div>
        <Button asChild size="sm" className="">
          <Link href={`/app/event/${e.id}`}>view</Link>
        </Button>
      </div>
    </div>
  );
}
