import { useEffect } from "react";
import { TAlert } from "../types/alertType";

const icons = {
  warning: (
    <img className="alert-icon" src="/warning-circle-svg.svg" alt="WARNING" />
  ),
  info: <img className="alert-icon" src="/info-svg.svg" alt="INFO" />,
  error: <img className="alert-icon" src="/error-box-svg.svg" alt="ERROR" />,
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

  let timer: number | undefined = undefined;

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
      <div className="alert-icon">{icon}</div>
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
