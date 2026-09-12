"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/auth-context";
import { Crown, Sparkles, LogOut, Zap, LayoutDashboard, DownloadCloud } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const {
    user,
    loading,
    isPro,
    isInfinite,
    usageCount,
    logout,
    setIsAuthModalOpen,
    setIsPricingModalOpen,
  } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-gray-200/80 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-orange-500/30 shadow-sm">
                <Image src="/icon.svg" alt="VoiceScribe Logo" fill className="object-cover" priority />
              </div>
              <span className="text-xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                VoiceScribe
              </span>
            </Link>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Chrome Extension Download Button */}
            <a
              href="/voicescribe-extension.zip"
              download="voicescribe-extension.zip"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-gray-300 dark:border-white/10 transition-colors cursor-pointer"
              title="Download VoiceScribe Chrome Extension"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-orange-500" />
              <span>Chrome Extension</span>
            </a>

            {/* Dashboard Link for logged-in users */}
            {user && (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-gray-300 dark:border-white/10 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
                <span>My Transcripts</span>
              </Link>
            )}

            {/* Status / Plan Badge */}
            {!loading && (
              <>
                {isInfinite ? (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                    title="View Analytics & Revenue"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Admin Analytics ↗
                  </Link>
                ) : isPro ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Pro Member
                  </span>
                ) : (
                  <button
                    onClick={() => setIsPricingModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-950 dark:text-orange-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current text-orange-600 dark:text-orange-400" />
                    <span>Free: {Math.max(0, 2 - usageCount)}/2 left</span>
                    <span className="font-bold text-orange-700 dark:text-orange-300 underline ml-0.5">
                      Upgrade
                    </span>
                  </button>
                )}
              </>
            )}

            <ThemeToggle />

            {/* User Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-gray-300 dark:border-white/10 cursor-pointer"
                    >
                      {user.photoURL ? (
                        <Image
                          unoptimized
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">
                          {user.email?.[0].toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {/* User Dropdown */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl z-50 text-sm">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10">
                          <p className="font-bold text-gray-950 dark:text-white truncate">
                            {user.displayName || "VoiceScribe User"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5 font-medium">
                            {user.email}
                          </p>
                          <div className="mt-2">
                            {isInfinite ? (
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Infinite Access
                              </span>
                            ) : isPro ? (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Pro Active (₦2,000/mo)
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                                Transcriptions used: {usageCount} / 2
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Navigation Links inside Dropdown */}
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
                          My Transcriptions
                        </Link>

                        {isInfinite && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Admin Analytics
                          </Link>
                        )}

                        {!isInfinite && !isPro && (
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setIsPricingModalOpen(true);
                            }}
                            className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-orange-700 dark:text-orange-400 hover:bg-orange-500/15 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Upgrade to Pro (₦2,000/mo)
                          </button>
                        )}

                        <a
                          href="/voicescribe-extension.zip"
                          download="voicescribe-extension.zip"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer md:hidden"
                        >
                          <DownloadCloud className="w-3.5 h-3.5 text-orange-500" />
                          Download Chrome Extension
                        </a>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-gray-800 dark:text-gray-300 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
