export default function LoadingCalendar() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6 lg:grid-rows-3 h-screen max-w-500 mx-auto px-4">
      {/* Main calendar view - bottom left, spans 4 columns and 2 rows */}
      <div className="lg:col-span-4 lg:row-span-2 bg-card rounded-xl border border-border animate-pulse h-40 lg:h-full" />

      {/* Side panel - bottom right, spans 2 columns and 2 rows */}
      <div className="lg:col-span-2 lg:row-span-2 bg-card rounded-xl border border-border animate-pulse h-40 lg:h-full" />
    </div>
  );
}
