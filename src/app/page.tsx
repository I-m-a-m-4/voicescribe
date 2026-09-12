"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mic, Zap, DollarSign, ShieldCheck, Sparkles, Mic2 } from "lucide-react";

import FileUploadZone from "@/components/file-upload-zone";
import LoadingState from "@/components/loading-state";
import TranscriptionResult from "@/components/transcription-result";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setTranscription(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setError(null);
    setTranscription(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      setTranscription(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500 to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 flex-grow flex flex-col justify-center pb-24 pt-10 sm:pb-32 lg:flex-row lg:items-start lg:gap-x-10 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 pt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-20 lg:mt-0"
          >
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold leading-6 text-brand-400 ring-1 ring-inset ring-brand-500/20">
                Latest Update
              </span>
              <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-300">
                <span>Just shipped Groq Integration</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </span>
            </a>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            Intelligent Audio to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">English Transcription</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-gray-300"
          >
            VoiceScribe is a highly accessible, premium, and affordable audio-to-text tool. Upload your audio or video and get highly accurate English transcripts in seconds.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex items-center gap-x-6 hidden lg:flex"
          >
            <a href="#features" className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors">
              Learn more about our features <span aria-hidden="true">→</span>
            </a>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-16 flex w-full max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32 flex-col items-center"
        >
          {/* Main App Workspace injected right into the landing page */}
          <div className="w-full max-w-3xl flex flex-col items-center">
            <FileUploadZone onFileSelect={handleFileSelect} isLoading={isTranscribing} />

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 w-full text-center"
              >
                {error}
              </motion.div>
            )}

            {file && !isTranscribing && !transcription && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-center w-full"
              >
                <button
                  onClick={handleTranscribe}
                  className="px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Transcript
                </button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isTranscribing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full"
                >
                  <LoadingState />
                </motion.div>
              )}

              {transcription && !isTranscribing && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="w-full"
                >
                  <TranscriptionResult text={transcription} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <div id="features" className="py-24 sm:py-32 bg-black/20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-400">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">No-compromise transcription</p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                { name: 'Lightning Fast', description: 'Powered by Groq hardware and Whisper API to give you transcripts in seconds.', icon: Zap },
                { name: 'Highly Affordable', description: 'Cost-effective processing means you pay a fraction of the cost of traditional services.', icon: DollarSign },
                { name: 'Private & Secure', description: 'Your files are processed securely and never stored longer than necessary.', icon: ShieldCheck },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col glass p-8 rounded-2xl">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <feature.icon className="h-6 w-6 flex-none text-brand-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
