"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, AlertTriangle, RefreshCw, Copy, Check, Download, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface LiveDictationProps {
  onTranscriptionUpdate: (text: string) => void;
  onSaveToHistory?: (text: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Español)" },
  { code: "fr-FR", label: "French (Français)" },
  { code: "de-DE", label: "German (Deutsch)" },
  { code: "it-IT", label: "Italian (Italiano)" },
  { code: "pt-BR", label: "Portuguese (Brasil)" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "ja-JP", label: "Japanese (日本語)" },
  { code: "ar-SA", label: "Arabic (العربية)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
];

export default function LiveDictation({ onTranscriptionUpdate, onSaveToHistory }: LiveDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [copied, setCopied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const selectedLangRef = useRef(selectedLang);
  const textContainerRef = useRef<HTMLDivElement>(null);

  selectedLangRef.current = selectedLang;

  // Auto-scroll when new text arrives
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [finalText, interimText]);

  // Clean setup for Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Your browser does not support the Web Speech API. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLangRef.current;

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      let newlyFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newlyFinal += transcript + " ";
        } else {
          currentInterim += transcript;
        }
      }

      if (newlyFinal) {
        setFinalText((prev) => {
          const updated = prev + newlyFinal;
          onTranscriptionUpdate(updated.trim());
          return updated;
        });
      }

      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition event error:", event.error);
      if (event.error === "no-speech") {
        // Normal silence timeout; keep listening
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission was denied. Please allow microphone access in your browser address bar.");
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }
      if (event.error === "network") {
        setError("Network error occurred during speech recognition. Reconnecting...");
        return;
      }
      if (event.error !== "aborted") {
        setError(`Speech recognition notice: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if session is meant to stay active
      if (isListeningRef.current) {
        try {
          recognition.lang = selectedLangRef.current;
          recognition.start();
        } catch {
          // Retry after brief delay if recognition was still terminating
          setTimeout(() => {
            if (isListeningRef.current) {
              try {
                recognition.lang = selectedLangRef.current;
                recognition.start();
              } catch (e) {
                console.warn("Could not restart speech recognition:", e);
              }
            }
          }, 300);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [onTranscriptionUpdate]);

  const toggleListening = useCallback(() => {
    setError(null);

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      setInterimText("");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      // Trigger save callback if full text exists
      if (finalText.trim() && onSaveToHistory) {
        onSaveToHistory(finalText.trim());
      }
    } else {
      if (!recognitionRef.current) {
        setError("Speech recognition is not initialized or unsupported in this browser.");
        return;
      }

      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (e: any) {
        console.error("Failed to start speech recognition:", e);
        // If already started, mark listening
        if (e.name === "InvalidStateError") {
          isListeningRef.current = true;
          setIsListening(true);
        } else {
          setError(`Could not activate microphone: ${e.message || "Unknown error"}`);
        }
      }
    }
  }, [finalText, onSaveToHistory, selectedLang]);

  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    selectedLangRef.current = newLang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
      if (isListeningRef.current) {
        try {
          recognitionRef.current.stop();
          // onend will automatically restart with new lang
        } catch {}
      }
    }
  };

  const clearTranscription = () => {
    setFinalText("");
    setInterimText("");
    onTranscriptionUpdate("");
  };

  const handleCopy = async () => {
    const textToCopy = (finalText + (interimText ? " " + interimText : "")).trim();
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownload = () => {
    const textToDownload = (finalText + (interimText ? " " + interimText : "")).trim();
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `live_dictation_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalWords = (finalText + " " + interimText)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const totalChars = (finalText + interimText).length;

  if (!isSupported) {
    return (
      <div className="p-8 bg-red-500/10 border border-dashed border-red-500/30 rounded-xl text-center max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h4 className="text-base font-bold text-red-600 dark:text-red-400 mb-2">
          Browser Speech Recognition Not Supported
        </h4>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          The Web Speech API is not enabled in this browser. For free, unlimited in-browser live dictation,
          please open VoiceScribe in <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Safari</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 sm:p-8 glass-panel rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-center flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/80 dark:bg-white/5 shadow-xl"
      >
        {/* Pulsing Audio Animation Header */}
        <div className="flex flex-col items-center">
          {isListening ? (
            <div className="relative mb-6">
              <span className="absolute -inset-4 rounded-full bg-blue-500/25 animate-ping" />
              <span className="absolute -inset-8 rounded-full bg-blue-500/15 animate-pulse" />
              <button
                onClick={toggleListening}
                className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Click to stop listening"
              >
                <Mic className="w-10 h-10 animate-pulse text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={toggleListening}
              className="w-22 h-22 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-dashed border-blue-500/35 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Click to start dictation"
            >
              <Mic className="w-10 h-10" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-dashed border-blue-500/30 text-xs font-bold mb-2">
            <span className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-blue-500"}`} />
            {isListening ? "Listening live..." : "Ready to dictate"}
          </div>

          <h3 className="text-xl font-extrabold text-gray-950 dark:text-white mb-2">
            Browser Live Speech-to-Text
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            Free, zero-credit transcription running locally inside your browser engine. Perfect for live speech, lectures, or playing videos aloud without consuming Groq credits.
          </p>

          {/* Controls Bar: Language + Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 border border-dashed border-gray-300 dark:border-white/15 text-xs font-medium text-gray-800 dark:text-gray-200">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-gray-800 dark:text-gray-200"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-zinc-900 text-black dark:text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md ${
                isListening
                  ? "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
              }`}
            >
              {isListening ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  Stop Dictation
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Dictation
                </>
              )}
            </button>

            {(finalText || interimText) && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-dashed border-gray-300 dark:border-white/15 transition-all cursor-pointer"
                  title="Copy transcript"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-dashed border-gray-300 dark:border-white/15 transition-all cursor-pointer"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .txt</span>
                </button>

                <button
                  onClick={clearTranscription}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-red-500/10 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 text-xs font-semibold border border-dashed border-gray-300 dark:border-white/15 transition-all cursor-pointer"
                  title="Clear transcript"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-dashed border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium max-w-md text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Real-time Transcription Stream Area */}
        <div
          ref={textContainerRef}
          className="mt-2 p-5 w-full bg-gray-50/90 dark:bg-black/40 rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-left min-h-[160px] max-h-[360px] overflow-y-auto custom-scrollbar"
        >
          {finalText || interimText ? (
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-sans">
              {finalText}
              <span className="text-blue-500 dark:text-blue-400 font-medium italic underline decoration-dotted ml-1">
                {interimText}
              </span>
            </p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400 dark:text-gray-500">
              <Mic className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs sm:text-sm font-medium">
                {isListening
                  ? "Listening... Speak clearly or play audio into your microphone."
                  : "Click \"Start Dictation\" to begin real-time speech-to-text."}
              </p>
            </div>
          )}
        </div>

        {/* Word and Character Count Footer */}
        {(finalText || interimText) && (
          <div className="mt-3 flex items-center justify-between w-full text-[11px] text-gray-500 dark:text-gray-400 px-1 font-medium">
            <span>Language: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label}</span>
            <span>
              {totalWords} {totalWords === 1 ? "word" : "words"} &bull; {totalChars} characters
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
