import NavBar from "./(header-footer)/NavBar";
import CalendarView from "./(calendar)/CalendarView";
import Footer from "./(header-footer)/Footer";
import { Suspense } from "react";
import Loading from "./(header-footer)/Loading";
import { getEvents } from "@/server-actions/supa";

export default function Home() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<Loading />}>
        <CalendarViewEventWrapper />
      </Suspense>
      <Footer />
    </>
  );
}

async function CalendarViewEventWrapper() {
  const events = await getEvents();
  return <CalendarView dbEvents={events} />;
}
