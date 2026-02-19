import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-primary flex items-center justify-center">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Blueshot</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Built for teams who value their time.
        </p>
      </div>
    </footer>
  );
}
