import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Bell,
  Users,
  Zap,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isLoggedIn = !!session;
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Blueshot</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/app">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
              in sync. Never miss an event, get instant notifications, and
              manage your calendar with ease.
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

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to make scheduling effortless for teams
              of all sizes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CalendarDays className="size-6" />}
              title="Smart Calendar"
              description="Intuitive calendar view with daily, weekly, and monthly layouts. See all your events at a glance."
            />
            <FeatureCard
              icon={<Bell className="size-6" />}
              title="Real-time Notifications"
              description="Get instant alerts when events are created, updated, or when you need to acknowledge attendance."
            />
            <FeatureCard
              icon={<Users className="size-6" />}
              title="Group Management"
              description="Create and manage user groups and event groups. Assign permissions and control access easily."
            />
            <FeatureCard
              icon={<Zap className="size-6" />}
              title="Instant Updates"
              description="Changes sync in real-time across all devices. Everyone stays on the same page, always."
            />
            <FeatureCard
              icon={<Shield className="size-6" />}
              title="Permission Controls"
              description="Fine-grained access controls let you decide who can view, edit, or manage events and groups."
            />
            <FeatureCard
              icon={<Clock className="size-6" />}
              title="Quick Acknowledgement"
              description="One-tap event acknowledgement lets your team confirm attendance in seconds."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get started in minutes
            </h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps to transform how your team schedules.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create your account"
              description="Sign up for free and set up your profile in under a minute."
            />
            <StepCard
              number="2"
              title="Invite your team"
              description="Add team members and organize them into groups based on your needs."
            />
            <StepCard
              number="3"
              title="Start scheduling"
              description="Create events, send notifications, and keep everyone in sync."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isLoggedIn
              ? "Ready to get back to work?"
              : "Ready to streamline your scheduling?"}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {isLoggedIn
              ? "Your dashboard is waiting for you."
              : "Join teams who use Blueshot to stay organized and never miss a beat."}
          </p>
          <Button size="lg" className="text-base px-8" asChild>
            <Link href={isLoggedIn ? "/app" : "/auth/register"}>
              {isLoggedIn ? "Go to Dashboard" : "Get started for free"}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="size-14 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
