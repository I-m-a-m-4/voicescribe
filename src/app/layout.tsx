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

import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "VoiceScribe - Intelligent Audio Transcription",
  description: "Highly accessible, and affordable audio-to-English transcription.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative text-gray-100">
        <Navbar />
        <main className="flex-grow pt-16 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
