import type { Metadata } from "next";
import { Montserrat, Fira_Mono, Geist } from "next/font/google";
import "./globals.css";
import AlertProvider from "./(alert)/AlertProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
    <html
      lang="en"
      className={`${geist.variable} dark`}
      suppressHydrationWarning
    >
      <body className={`${mont.variable} ${firaMono.variable} antialiased`}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <AlertProvider>{children}</AlertProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
