import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetailLaunch Lab | AI Virtual Try-On & Demand Intelligence",
  description:
    "Validate fashion demand before production with real YouCam AI Virtual Try-On, shopper feedback, and live purchase-intent analytics.",
  openGraph: {
    title: "RetailLaunch Lab",
    description:
      "See it. Love it. Before it exists. AI-powered fashion launches backed by real demand signals.",
    url: "https://retaillaunch-lab.vercel.app",
    siteName: "RetailLaunch Lab",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
