export default function LoadingAuthPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background px-4">
      {/* Logo placeholder */}
      <div className="w-32 h-8 bg-card rounded-lg animate-pulse mb-12" />

      {/* Card container */}
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 space-y-6">
        {/* Icon placeholder */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
        </div>

        {/* Header section */}
        <div className="text-center space-y-3">
          {/* Title skeleton */}
          <div className="h-7 bg-muted rounded-lg animate-pulse w-3/4 mx-auto" />

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-lg animate-pulse w-5/6 mx-auto" />
            <div className="h-4 bg-muted rounded-lg animate-pulse w-4/6 mx-auto" />
          </div>
        </div>

        {/* Email display box skeleton */}
        <div className="h-12 bg-muted rounded-lg animate-pulse" />

        {/* Content spacer */}
        <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />

        {/* Button skeleton */}
        <div className="h-10 bg-primary rounded-lg animate-pulse" />

        {/* Footer text skeleton */}
        <div className="flex justify-center gap-1">
          <div className="h-4 bg-muted rounded-lg animate-pulse w-20" />
          <div className="h-4 bg-muted rounded-lg animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}
