export default function LoadingChatArea() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* header skeleton */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card animate-pulse">
        <div className="h-8 w-8 bg-muted rounded-full" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* messages skeleton */}
      <div className="flex-1 p-6 bg-background animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded mb-2 last:mb-0 w-3/4" />
        ))}
      </div>

      {/* input skeleton */}
      <div className="p-4 bg-card border-t border-border animate-pulse">
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}
