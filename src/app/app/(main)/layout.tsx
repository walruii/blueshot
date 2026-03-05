import Footer from "../_components/Footer";
import NavBar from "../_components/NavBar";
import BottomNav from "../_components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <div className="pb-20 md:pb-0">{children}</div>
      <Footer />
      <BottomNav />
    </>
  );
}
