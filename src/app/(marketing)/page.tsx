import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import CTA from "./CTA";
import { Footer } from "react-day-picker";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isLoggedIn = !!session;
  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <Features />
      <HowItWorks />
      <CTA isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  );
}
