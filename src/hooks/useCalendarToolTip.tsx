import { useRef, useState } from "react";
import { THoverData } from "../app/types/hoverData";
import { TEvent } from "../app/types/eventTypes";

export function useCalendarTooltip() {
  const [hoverData, setHoverData] = useState<THoverData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, events: TEvent[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const { clientX: x, clientY: y } = e;

    timerRef.current = setTimeout(() => {
      setHoverData({ events, mouse: { x, y } });
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHoverData(null), 300);
  };

  return { hoverData, handleMouseEnter, handleMouseLeave };
}
