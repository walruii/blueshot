const DotIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    viewBox="0 0 448 448"
    width={size}
    height={size}
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="224" cy="224" r="192" />
  </svg>
);

export default DotIcon;
