"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  const [date, setDate] = useState<string>(new Date().toDateString());
  const [time, setTime] = useState<string>(
    new Date().toLocaleDateString().slice(10),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date().toDateString());
      setTime(new Date().toLocaleString().slice(10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-semibold flex flex-col justify-center items-end">
      <p>{date}</p>
      <p className="">{time}</p>
    </div>
  );
}
