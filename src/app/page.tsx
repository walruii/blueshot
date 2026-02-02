import NavBar from "./header-footer/NavBar";
import CalendarView from "./calendar/CalendarView";
import Footer from "./header-footer/Footer";
import { Suspense } from "react";
import Loading from "./header-footer/Loading";

export default function Home() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<Loading />}>
        <CalendarView />
      </Suspense>
      <Footer />
    </>
  );
}
