export default function LoadingConvoSidebar() {
  return (
    <>
      {/* desktop/tablet size skeleton */}
      <aside className="hidden sm:flex w-80 bg-card border-r border-border flex flex-col animate-pulse" />
      {/* mobile toggle skeleton */}
      <div className="sm:hidden fixed top-4 left-4 h-10 w-10 bg-card rounded animate-pulse" />
    </>
  );
}
