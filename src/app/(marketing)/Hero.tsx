import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Schedule smarter.{" "}
            <span className="text-primary">Meet seamlessly.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Blueshot is the real-time scheduling platform that keeps your team
            in sync. Never miss an event, get instant notifications, and manage
            your calendar with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" className="text-base px-6" asChild>
                <Link href="/app">
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="text-base px-6" asChild>
                  <Link href="/auth/register">
                    Start for free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-6"
                  asChild
                >
                  <Link href="/auth/signin">Sign in to your account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
