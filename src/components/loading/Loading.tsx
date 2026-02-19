import LoadingCircle from "../../svgs/LoadingCircle";

interface LoadingProps {
  /** Optional container className for styling flexibility */
  containerClassName?: string;
  /** Optional size for the spinner - default is 100px (100x100) */
  size?: number;
}

export default function Loading({
  containerClassName = "h-screen flex justify-center items-center",
  size,
}: LoadingProps = {}) {
  return (
    <div className={containerClassName}>
      <LoadingCircle size={size} />
    </div>
  );
}
