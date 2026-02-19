export default function HowItWorks() {
  return (
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
