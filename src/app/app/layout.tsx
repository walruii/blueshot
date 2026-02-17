import Footer from "../(header-footer)/Footer";
import NavBar from "../(header-footer)/NavBar";
import RealtimeInboxWrapper from "./RealtimeInboxWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <RealtimeInboxWrapper>{children}</RealtimeInboxWrapper>
      <Footer />
    </>
  );
}
