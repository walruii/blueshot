"use client";
import { TAlert } from "../../types/alertType";
import ErrorIcon from "../../svgs/ErrorIcon";
import InfoIcon from "../../svgs/infoIcon";
import WarningIcon from "../../svgs/AlertIcon";
import CrossIcon from "@/svgs/CrossIcon";
import useAlertTimer from "@/hooks/useAlertTimer";

const ALERT_CONFIG = {
  warning: { icon: <WarningIcon />, color: "border-l-yellow-500" },
  info: { icon: <InfoIcon />, color: "border-l-blue-500" },
  error: { icon: <ErrorIcon />, color: "border-l-red-500" },
};

export default function Alert({
  alert,
  onClose,
}: {
  alert: TAlert;
  onClose: () => void;
}) {
  const { handleMouseEnter, handleMouseLeave, timeLeft } =
    useAlertTimer(onClose);

  const { icon, color } = ALERT_CONFIG[alert.type];
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center fixed right-2 top-2 rounded-xl border
        border-zinc-800 p-4 bg-zinc-900 min-w-80 max-w-130 ${color} border-l-6 transition-all ease-in-out`}
    >
      <div className="shrink-0 mr-2">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold">{alert.title}</p>
        <p className="text-sm opacity-80">{alert.description}</p>
        <p className="text-sm opacity-80 mt-2">Going away in {timeLeft}</p>
      </div>
      <div className="shrink-0">
        <button
          className="p-3 hover:bg-zinc-800 rounded bg-zinc-800 ml-2"
          onClick={() => onClose()}
        >
          <CrossIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
