import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
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
  );
}
