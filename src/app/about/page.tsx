"use client";

import Link from "next/link";
import { ArrowLeft, Mic, Zap, Globe, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
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
              <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              About VoiceScribe
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-950 dark:text-white mt-4 tracking-tight">
            What is VoiceScribe?
          </h1>
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-400 mt-3 font-medium max-w-2xl">
            VoiceScribe is an incredibly fast AI-powered transcription tool designed to effortlessly convert your audio and video files into highly accurate text.
          </p>
        </div>
      </div>

      {/* Hero Image or Graphic Placeholder */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-64 sm:h-80 rounded-3xl bg-gradient-to-tr from-orange-500/20 via-orange-500/5 to-amber-500/10 border border-orange-500/20 mb-12 flex items-center justify-center shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 text-center px-4">
          <Mic className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Powered by Groq Whisper</h2>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            Experience lightning-fast transcription using state-of-the-art AI models, processing hours of audio in just seconds.
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Blazing Fast Speed</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            By leveraging Groq&apos;s LPU architecture, VoiceScribe achieves transcription speeds that are orders of magnitude faster than traditional GPU-based solutions. Get your transcripts almost instantly.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Translation & Video Support</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            Upload large video files seamlessly with our client-side audio extraction. Not only can you transcribe in the original language, but you can also translate any supported language directly into English.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 rounded-3xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure & Private</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            Your audio and video files are processed securely. Video files are processed entirely in your browser to extract audio before uploading, ensuring maximum privacy and minimal bandwidth usage.
          </p>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-inner">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to start transcribing?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
          Try it out for free and experience the speed of Groq Whisper yourself.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] cursor-pointer"
        >
          <Mic className="w-4 h-4" />
          Go to Transcriber
        </Link>
      </div>
    </div>
  );
}
