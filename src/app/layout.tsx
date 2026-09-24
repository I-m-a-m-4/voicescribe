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
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import PricingModal from "@/components/pricing-modal";
import Script from "next/script";

export const metadata: Metadata = {
  title: "VoiceScribe - Intelligent Audio Transcription",
  description: "Highly accessible, and affordable audio-to-English transcription.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col relative text-gray-900 dark:text-gray-100 bg-white dark:bg-[#09090b] transition-colors">
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow pt-16 relative z-10">
              {children}
            </main>
            <Footer />
            <AuthModal />
            <PricingModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
