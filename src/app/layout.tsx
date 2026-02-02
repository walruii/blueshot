import type { Metadata } from "next";
import { Montserrat, Fira_Mono } from "next/font/google";
import "./globals.css";
import AlertProvider from "./alert/AlertProvider";

const mont = Montserrat({
  variable: "--font-mont",
  subsets: ["latin"],
});

const firaMono = Fira_Mono({
  weight: ["400", "500", "700"],
  variable: "--font-fira-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blueshot",
  description: "A Real Time Online scheduler and Meeting hosting WebApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mont.variable} ${firaMono.variable} antialiased`}>
        <AlertProvider>{children}</AlertProvider>
      </body>
    </html>
  );
}
