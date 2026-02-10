"use client";

import { useEffect, useState } from "react";

const TAG = {
  fiveMinutes: {
    title: "5 Mins left",
    color: "bg-red-500",
  },
  tenMinutes: {
    title: "10 Mins Left",
    color: "bg-yellow-500",
  },
  onGoing: {
    title: "On Going",
    color: "bg-green-600",
  },
};
type TagKey = keyof typeof TAG;

export default function UpcomingTag({ from }: { from: Date }) {
  const getTagStatus = (startTime: Date) => {
    const now = Date.now();
    const startTimeMs = startTime.getTime();

    if (now > startTimeMs) return "onGoing";
    if (now + 300000 > startTimeMs) return "fiveMinutes";
    if (now + 600000 > startTimeMs) return "tenMinutes";
    return null;
  };

  const [tagKey, setTagKey] = useState<TagKey | null>(() => getTagStatus(from));

  useEffect(() => {
    if (tagKey === "onGoing") return;

    const check = setInterval(() => {
      const nextStatus = getTagStatus(from);
      setTagKey(nextStatus);

      if (nextStatus === "onGoing") {
        clearInterval(check);
      }
    }, 10000);

    return () => clearInterval(check);
  }, [from, tagKey]);

  if (!tagKey) return null;

  const tag = TAG[tagKey];
  return (
    <span className={`block font-bold px-2 rounded-lg ${tag.color}`}>
      {tag.title}
    </span>
  );
}
