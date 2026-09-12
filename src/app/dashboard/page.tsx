"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import {
  Mic,
  Copy,
  Download,
  Trash2,
  Search,
  ArrowLeft,
  Calendar,
  FileText,
  Sparkles,
  Zap,
  Check,
  ExternalLink,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserDashboard() {
  const {
    user,
    loading,
    isPro,
    isInfinite,
    remainingFreeUses,
    usageCount,
    transcriptionHistory,
    deleteTranscriptionItem,
    setIsAuthModalOpen,
    setIsPricingModalOpen,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownload = (fileName: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.replace(/\.[^/.]+$/, "")}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filtered transcriptions
  const filteredHistory = useMemo(() => {
    return transcriptionHistory.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.fileName.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
    });
  }, [transcriptionHistory, searchQuery]);

  const totalWords = useMemo(() => {
    return transcriptionHistory.reduce((acc, item) => acc + (item.wordCount || 0), 0);
  }, [transcriptionHistory]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-2">
            Sign In to View Your Transcriptions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
            Sign in to access your complete transcription history, search transcripts, and download past files.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/30 cursor-pointer"
            >
              Sign In / Sign Up
            </button>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Return to Transcriber"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-950 dark:text-orange-300 border border-orange-500/30">
              <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              Transcription History
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-2 tracking-tight">
            My Transcriptions
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400 mt-1 font-medium">
            Browse, search, copy, or export your audio and video transcriptions.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all shadow-md shadow-orange-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Mic className="w-4 h-4" />
          Transcribe New Audio
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Total Transcriptions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Total Transcriptions Saved
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-gray-950 dark:text-white">
              {transcriptionHistory.length}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full">
              {totalWords.toLocaleString()} words
            </span>
          </div>
        </div>

        {/* Current Plan */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Current Subscription Plan
          </span>
          <div className="mt-3 flex items-center justify-between">
            {isInfinite ? (
              <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Crown className="w-5 h-5" /> Unlimited Admin
              </span>
            ) : isPro ? (
              <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5" /> Monthly Pro (Active)
              </span>
            ) : (
              <div>
                <span className="text-xl font-extrabold text-gray-950 dark:text-white">
                  Free Tier
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {Math.max(0, 2 - usageCount)} of 2 free uses left
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade / Pro Perks */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/15 via-white dark:via-[#121214] to-orange-500/5 border border-orange-500/30 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
              {isPro || isInfinite ? "Pro Status Active" : "Upgrade to Pro"}
            </span>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
              {isPro || isInfinite
                ? "You have permanent unlimited high-speed transcriptions."
                : "Get unlimited transcriptions for only ₦2,000 / month."}
            </p>
          </div>
          {!isPro && !isInfinite && (
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 underline cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Upgrade for ₦2,000/mo ↗
            </button>
          )}
        </div>
      </div>

      {/* History List Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              Generated Transcripts
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
              Every audio or video transcript generated with your account is preserved here.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-60 sm:w-72 font-medium"
            />
          </div>
        </div>

        {/* Transcripts List */}
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white mb-1">
              {searchQuery ? "No matching transcripts found" : "No transcriptions yet"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto font-medium">
              {searchQuery
                ? "Try searching for a different keyword or file name."
                : "Drop your first audio or video file on the home page to start generating transcripts!"}
            </p>
            {!searchQuery && (
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                Go to Transcriber
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all hover:border-orange-500/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-950 dark:text-white truncate max-w-xs sm:max-w-md">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5">
                          <span>{item.fileSize}</span>
                          <span>•</span>
                          <span>{item.wordCount} words</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleCopy(item.id, item.text)}
                        className="p-2 rounded-lg bg-white dark:bg-white/10 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownload(item.fileName, item.text)}
                        className="p-2 rounded-lg bg-white dark:bg-white/10 border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Download .txt"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>

                      <button
                        onClick={() => deleteTranscriptionItem(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete transcript"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Content Preview / Expand */}
                  <div className="p-4 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/5">
                    <p
                      className={`text-sm text-gray-900 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap ${
                        !isExpanded && "line-clamp-3"
                      }`}
                    >
                      {item.text}
                    </p>
                    {item.text.length > 200 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        {isExpanded ? "Show Less ↑" : "Read Full Transcript ↓"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
