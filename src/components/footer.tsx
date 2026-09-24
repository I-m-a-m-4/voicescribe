import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Scale, Info, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-[#09090b]/80 backdrop-blur-md transition-colors mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-orange-500/30">
              <Image src="/icon.svg" alt="VoiceScribe" fill className="object-cover" />
            </div>
            <span className="font-extrabold text-base text-gray-950 dark:text-white tracking-tight">
              VoiceScribe
            </span>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium border-l border-gray-300 dark:border-white/10 pl-3">
              AI Audio & Video Transcription
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Link href="/about" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>About</span>
            </Link>

            <Link href="/privacy" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Privacy Policy</span>
            </Link>

            <Link href="/legal" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Scale className="w-3.5 h-3.5 text-orange-500" />
              <span>Terms & Legal</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center md:text-right flex items-center gap-1">
            <span>© {new Date().getFullYear()} VoiceScribe. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
