"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mic, Zap, DollarSign, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500 to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 flex-grow flex flex-col justify-center pb-24 pt-10 sm:pb-32 lg:flex-row lg:items-center lg:gap-x-10 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 pt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-24 sm:mt-32 lg:mt-16"
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
            className="mt-10 flex items-center gap-x-6"
          >
            <Link
              href="/dashboard"
              className="rounded-full bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 transition-all flex items-center gap-2"
            >
              <Mic className="h-5 w-5" />
              Start Transcribing
            </Link>
            <a href="#features" className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32"
        >
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10 glass-panel lg:rounded-2xl">
              <div className="rounded-md bg-gray-900/50 p-8 flex flex-col justify-center items-center h-80 w-full sm:w-[500px] border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute -inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/10 opacity-30 pointer-events-none" />
                 
                 <div className="flex flex-col items-center justify-center space-y-4">
                   <div className="h-20 w-20 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse">
                     <Mic className="h-10 w-10 text-brand-400" />
                   </div>
                   <div className="text-center">
                     <h3 className="text-xl font-semibold text-white">Transcribing audio...</h3>
                     <p className="text-sm text-gray-400 mt-2 max-w-[280px]">"Hello everyone, welcome to the presentation on the future of AI..."</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Grid below hero */}
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
