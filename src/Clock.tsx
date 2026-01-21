import { useEffect, useState } from "react";

export default function Clock() {
  const [dateTime, setDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <p>{dateTime.toLocaleString()}</p>
    </>
  );
}
