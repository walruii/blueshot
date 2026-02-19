import Footer from "./(header-footer)/Footer";
import NavBar from "./(header-footer)/NavBar";
import BottomNav from "./(header-footer)/BottomNav";
import RealtimeInboxWrapper from "./RealtimeInboxWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <div className="pb-20 md:pb-0">
        <RealtimeInboxWrapper>{children}</RealtimeInboxWrapper>
      </div>
      <Footer />
      <BottomNav />
    </>
  );
}
