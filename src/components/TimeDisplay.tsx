"use client";

import { dateToTimeString } from "@/utils/dateUtil";

export default function TimeDisplay({ date }: { date: Date }) {
  return <>{dateToTimeString(date)}</>;
}
