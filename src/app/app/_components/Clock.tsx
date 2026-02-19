"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  const [date, setDate] = useState<string>(new Date().toDateString());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date().toDateString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-semibold flex flex-col justify-center items-end">
      <p>{date}</p>
    </div>
  );
}
