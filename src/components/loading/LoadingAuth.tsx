export default function LoadingAuth() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background px-4">
      {/* Logo placeholder */}
      <div className="w-32 h-8 bg-card rounded-lg animate-pulse mb-12" />

      {/* Card container */}
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-lg animate-pulse w-2/3" />
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-4">
          {/* Email input */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-lg animate-pulse w-12" />
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-lg animate-pulse w-16" />
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Button skeleton */}
        <div className="h-10 bg-primary rounded-lg animate-pulse mt-6" />

        {/* Footer text skeleton */}
        <div className="flex justify-center gap-1">
          <div className="h-4 bg-muted rounded-lg animate-pulse w-24" />
          <div className="h-4 bg-muted rounded-lg animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
}
