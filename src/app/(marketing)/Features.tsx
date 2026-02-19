import { Bell, CalendarDays, Clock, Shield, Users, Zap } from "lucide-react";

export default function Features() {
  return (
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
