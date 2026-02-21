import Footer from "../_components/Footer";
import NavBar from "../_components/NavBar";
import BottomNav from "../_components/BottomNav";
import RealtimeInboxProvider from "../_components/RealtimeInboxProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <div className="pb-20 md:pb-0">
        <RealtimeInboxProvider>{children}</RealtimeInboxProvider>
      </div>
      <Footer />
      <BottomNav />
    </>
  );
}
