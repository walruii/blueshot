const WarningIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    viewBox="0 0 512 512"
    className="alert-icon"
    width={size}
    height={size}
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Simplified and re-centered coordinates */}
    <path d="M278.31 48.29c-6.61-11.58-22.01-15.54-33.59-8.93-6.58 3.76-11.39 9.94-13.41 17.2L47.85 375.91c-11.69 20.46-4.58 46.52 15.88 58.21 6.45 3.68 13.74 5.62 21.17 5.62h342.2c23.56 0 42.67-19.11 42.67-42.67 0-7.43-1.94-14.72-5.62-21.17L278.31 48.29zM256 368c-15.24 0-26.67-11.26-26.67-26.28 0-15.7 11.08-26.96 26.67-26.96s26.67 11.26 26.67 26.62c0 15.36-11.43 26.62-26.67 26.62zm21.33-165.33h-42.66v-128h42.66v128z" />
  </svg>
);

export default WarningIcon;
