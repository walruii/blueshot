import { useEffect, useRef, useState } from "react";

export default function useAlertTimer(onClose: () => void) {
  const timeInterval = useRef<NodeJS.Timeout | string | undefined | number>(
    undefined,
  );
  const timerRef = useRef<NodeJS.Timeout | string | undefined | number>(
    undefined,
  );
  const [timeLeft, setTimeLeft] = useState<number>(4);

  const handleMouseEnter = () => {
    clearTimer();
    setTimeLeft(4);
  };

  const handleMouseLeave = () => {
    initTimer();
  };

  const initTimer = () => {
    timeInterval.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    timerRef.current = setTimeout(() => {
      clearInterval(timeInterval.current);
      onClose();
    }, 4000);
  };

  const clearTimer = () => {
    clearTimeout(timerRef.current);
    clearInterval(timeInterval.current);
  };

  useEffect(() => {
    initTimer();
    return () => {
      clearTimer();
    };
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    timeLeft,
  };
}
