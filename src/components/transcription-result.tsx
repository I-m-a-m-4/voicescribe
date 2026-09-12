"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Check } from "lucide-react";

interface TranscriptionResultProps {
  text: string;
}

export default function TranscriptionResult({ text }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "transcription.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg">
        <div className="bg-gray-100/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Transcription Result
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-transparent transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Copy transcript"
            >
              {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-transparent transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Download text file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download .txt</span>
            </button>
          </div>
        </div>
        <div className="p-6 bg-white/60 dark:bg-black/20 max-h-[500px] overflow-y-auto custom-scrollbar">
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap font-sans text-lg font-medium">
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
