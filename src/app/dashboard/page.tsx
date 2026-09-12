"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUploadZone from "@/components/file-upload-zone";
import LoadingState from "@/components/loading-state";
import TranscriptionResult from "@/components/transcription-result";
import { Mic2, Sparkles } from "lucide-react";

export default function Dashboard() {
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-brand-500/20 rounded-2xl mb-4">
            <Mic2 className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Dashboard
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Upload your audio or video file below. We'll extract the speech and generate a highly accurate transcript.
          </p>
        </motion.div>

        <FileUploadZone onFileSelect={handleFileSelect} isLoading={isTranscribing} />

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 w-full max-w-2xl text-center"
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
    </div>
  );
}
