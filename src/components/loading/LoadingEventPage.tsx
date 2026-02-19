export default function LoadingEventPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="inline-block bg-muted rounded-lg py-2 px-6 animate-pulse w-55 h-10" />
      </div>
      <div className="bg-card rounded-xl p-8 border mb-6 animate-pulse h-80 max-w-4xl mx-auto" />
      <div className="bg-card rounded-xl p-8 border animate-pulse h-57 max-w-4xl mx-auto" />
    </div>
  );
}
