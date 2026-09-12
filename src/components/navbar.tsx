"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/auth-context";
import { Crown, Sparkles, LogOut, User as UserIcon, Zap } from "lucide-react";
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
    <nav className="fixed top-0 w-full z-50 glass border-b border-gray-200/20 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                <Image src="/logo.jpg" alt="VoiceScribe Logo" fill className="object-cover" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                VoiceScribe
              </span>
            </Link>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status / Plan Badge */}
            {!loading && (
              <>
                {isInfinite ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-semibold">
                    <Crown className="w-3.5 h-3.5" />
                    Unlimited Admin
                  </span>
                ) : isPro ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pro Member
                  </span>
                ) : (
                  <button
                    onClick={() => setIsPricingModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium transition-colors"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Free: {Math.max(0, 2 - usageCount)}/2 left</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-300 underline ml-0.5">
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
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/10"
                    >
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">
                          {user.email?.[0].toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {/* User Dropdown */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-xl z-50 text-sm">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {user.displayName || "VoiceScribe User"}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                          <div className="mt-2">
                            {isInfinite ? (
                              <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Infinite Access
                              </span>
                            ) : isPro ? (
                              <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Pro Active
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                Transcriptions used: {usageCount} / 2
                              </span>
                            )}
                          </div>
                        </div>

                        {!isInfinite && !isPro && (
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setIsPricingModalOpen(true);
                            }}
                            className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 text-xs font-semibold transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Upgrade to Pro (₦1,000)
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-500/10 hover:text-red-500 text-xs font-medium transition-colors"
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
                    className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-medium transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]"
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
