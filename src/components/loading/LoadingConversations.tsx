export default function LoadingConversations() {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground dark">
      {/* Sidebar skeleton */}
      <div className="w-72 bg-card border-r border-border p-4 flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
      {/* Chat area skeleton */}
      <main className="flex-1 flex flex-col">
        {/* Chat header skeleton */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="w-32 h-4 bg-muted rounded" />
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 p-6 bg-background flex flex-col gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-${i % 2 === 0 ? "2/3" : "1/2"} h-5 bg-muted rounded animate-pulse`}
            />
          ))}
        </div>
        {/* Input skeleton */}
        <div className="p-4 bg-card border-t border-border flex gap-2 animate-pulse">
          <div className="flex-1 h-10 bg-muted rounded" />
          <div className="w-20 h-10 bg-muted rounded" />
        </div>
      </main>
    </div>
  );
}
