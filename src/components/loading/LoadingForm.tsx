export default function LoadingForm() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button placeholder */}
        <div className="mb-8">
          <div className="h-10 w-32 bg-card rounded-lg animate-pulse" />
        </div>

        {/* Form card skeleton */}
        <div className="bg-card rounded-xl border border-border p-8 space-y-6">
          {/* Title skeleton */}
          <div className="h-8 bg-muted rounded-lg animate-pulse w-1/3" />

          {/* Form sections */}
          <div className="space-y-6">
            {/* Section 1 - 3 form fields */}
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded-lg animate-pulse w-24" />
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded-lg animate-pulse w-20" />
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded-lg animate-pulse w-28" />
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Permission section */}
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded-lg animate-pulse w-32" />
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Button placeholders */}
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-muted rounded-lg animate-pulse flex-1" />
            <div className="h-10 bg-primary rounded-lg animate-pulse flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
