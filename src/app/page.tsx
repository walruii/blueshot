"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Page() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-3xl font-bold text-blue-500">Blueshot</div>
          <div className="flex gap-4">
            {session ? (
              <>
                <button
                  onClick={() => router.push("/app")}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => {
                    await authClient.signOut();
                    router.push("/");
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Manage Your <span className="text-blue-500">Events</span> Effortlessly
        </h1>
        <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto">
          Blueshot is a modern event management platform that helps you
          organize, schedule, and collaborate with your team. Keep track of all
          your events in one beautiful calendar.
        </p>
        {!session && (
          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/auth/register"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition text-lg"
            >
              Start Free
            </Link>
            <Link
              href="/auth/signin"
              className="border border-blue-500 hover:bg-blue-500/10 text-blue-400 hover:text-white font-semibold py-3 px-8 rounded-lg transition text-lg"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3">Beautiful Calendar</h3>
              <p className="text-zinc-400">
                View all your events in an intuitive calendar interface. Never
                miss an important date again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-zinc-400">
                Add team members to events and keep everyone in sync. Perfect
                for coordinating with your team.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold mb-3">Time Management</h3>
              <p className="text-zinc-400">
                Set start and end times for your events. Get precise control
                over your schedule.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-3">Event Details</h3>
              <p className="text-zinc-400">
                Add titles, descriptions, and all the details you need for
                comprehensive event tracking.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-zinc-400">
                Your data is encrypted and secure. Only you and invited members
                can see your events.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">Fast & Reliable</h3>
              <p className="text-zinc-400">
                Built for speed and reliability. Access your calendar anytime,
                anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-xl text-zinc-400 mb-8">
          Join thousands of users who are already managing their events with
          Blueshot.
        </p>
        {!session && (
          <Link
            href="/auth/register"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-10 rounded-lg transition text-lg"
          >
            Create Free Account
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-400">
          <p>&copy; 2026 Blueshot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
