"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  statusMessage?: string;
  currentSegment?: number;
  totalSegments?: number;
  progressPercent?: number;
}

export default function LoadingState({
  title = "Processing audio...",
  statusMessage,
  currentSegment,
  totalSegments,
  progressPercent,
}: LoadingStateProps) {
  const isMultiSegment = totalSegments && totalSegments > 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto mt-8 flex flex-col items-center justify-center p-8 sm:p-12 glass-panel rounded-xl border border-dashed border-orange-500/35 shadow-xl"
    >
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full blur-xl bg-orange-500/30 animate-pulse" />

        {/* Spinning loader */}
        <div className="relative bg-orange-500/10 dark:bg-black/40 p-4 rounded-xl border border-dashed border-orange-500/30">
          <Loader2 className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-spin" />
        </div>
      </div>

      <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white text-center">
        {title}
      </h3>

      {isMultiSegment && currentSegment ? (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-dashed border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            Processing segment {currentSegment} of {totalSegments} (
            {progressPercent ?? Math.round((currentSegment / totalSegments) * 100)}%)
          </span>
        </div>
      ) : null}

      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 font-medium text-center max-w-md">
        {statusMessage ||
          "Our AI is carefully transcribing your file. This takes just a few seconds per segment."}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 bg-gray-200 dark:bg-white/10 rounded-full mt-6 overflow-hidden relative">
        {progressPercent !== undefined ? (
          <motion.div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        ) : (
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "linear",
            }}
            style={{ width: "50%" }}
          />
        )}
      </div>
    </motion.div>
  );
}
