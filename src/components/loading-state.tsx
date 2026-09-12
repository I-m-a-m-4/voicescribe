"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto mt-8 flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-brand-500/20"
    >
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full blur-xl bg-brand-500/30 animate-pulse" />
        
        {/* Spinning loader */}
        <div className="relative bg-black/40 p-4 rounded-full border border-white/10">
          <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        </div>
      </div>
      
      <h3 className="mt-6 text-xl font-medium text-white">
        Processing audio...
      </h3>
      <p className="mt-2 text-sm text-gray-400 text-center max-w-md">
        Our AI is carefully transcribing your file. This usually takes just a few seconds depending on the file length.
      </p>
      
      {/* Progress bar simulation (since we don't know exact progress, we just use an indeterminate animated bar) */}
      <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
        <motion.div 
          className="h-full bg-brand-500 rounded-full"
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear"
          }}
          style={{ width: "50%" }}
        />
      </div>
    </motion.div>
  );
}
