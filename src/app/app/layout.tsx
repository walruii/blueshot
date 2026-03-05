import RealtimeInboxProvider from "./_components/RealtimeInboxProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RealtimeInboxProvider>{children}</RealtimeInboxProvider>;
}
