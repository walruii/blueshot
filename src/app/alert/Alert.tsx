"use client";
import { useEffect } from "react";
import { TAlert } from "../types/alertType";
import ErrorIcon from "../svgs/ErrorIcon";
import InfoIcon from "../svgs/infoIcon";
import WarningIcon from "../svgs/AlertIcon";

const icons = {
  warning: <WarningIcon />,
  info: <InfoIcon />,
  error: <ErrorIcon />,
};

const classes = {
  warning: "alert-warning",
  info: "alert-info",
  error: "alert-error",
};

export default function Alert({
  alert,
  onClose,
}: {
  alert: TAlert;
  onClose: () => void;
}) {
  const handleClose = () => {
    onClose();
  };

  let timer: number | undefined | NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(timer);
  };
  const handleMouseLeave = () => {
    timer = setTimeout(() => {
      onClose();
    }, 4000);
  };
  useEffect(() => {
    timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const icon = icons[alert.type];
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`alert-box ${classes[alert.type]}`}
    >
      {icon}
      <div className="alert-center-box">
        <p className="alert-box-title">{alert.title}</p>
        <p className="alert-box-desc">{alert.description}</p>
      </div>
      <div className="alert-button-box">
        <button className="alert-button" onClick={handleClose}>
          X
        </button>
      </div>
    </div>
  );
}
