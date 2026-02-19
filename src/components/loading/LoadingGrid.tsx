export default function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 max-w-500 mx-auto px-4">
      {/* Welcome Card */}
      <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-2/3 mb-4" />
        <div className="flex gap-4">
          <div className="h-20 w-20 bg-muted rounded-full shrink-0" />
          <div className="flex items-center">
            <div className="h-4 bg-muted rounded-lg w-32" />
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Notifications Card */}
      <div className="bg-card rounded-xl border border-border h-96 animate-pulse">
        <div className="p-4 border-b">
          <div className="h-6 bg-muted rounded-lg w-1/3" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Upcoming Events Card */}
      <div className="bg-card rounded-xl border border-border h-96 animate-pulse">
        <div className="p-4 border-b">
          <div className="h-6 bg-muted rounded-lg w-1/3" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
