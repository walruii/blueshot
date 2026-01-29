const ErrorIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    viewBox="0 0 512 512"
    className="alert-icon"
    width={size}
    height={size}
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M256 42.67C138.1 42.67 42.67 138.1 42.67 256s95.43 213.33 213.33 213.33 213.33-95.43 213.33-213.33S373.9 42.67 256 42.67zm48.92 265.08L256 258.83l-48.92 48.92-30.16-30.17L225.83 256l-48.91-48.92 30.16-30.16L256 225.83l48.92-48.91 30.17 30.16L286.17 256l48.92 48.92-30.17 30.17z" />
  </svg>
);

export default ErrorIcon;
