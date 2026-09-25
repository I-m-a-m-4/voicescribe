"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import FileUploadZone from "@/components/file-upload-zone";
import LoadingState from "@/components/loading-state";
import TranscriptionResult from "@/components/transcription-result";
import { useAuth } from "@/context/auth-context";
import { Sparkles, Crown, Zap, Lock } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translate, setTranslate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const {
    user,
    isPro,
    isInfinite,
    usageCount,
    remainingFreeUses,
    canTranscribe,
    setIsPricingModalOpen,
    recordTranscriptionSuccess,
  } = useAuth();

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setTranscription(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;

    if (!canTranscribe) {
      setIsPricingModalOpen(true);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscription(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("translate", translate.toString());
    if (user?.email) {
      formData.append("email", user.email);
    }
    if (user?.uid) {
      formData.append("uid", user.uid);
    }

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        console.error("Non-JSON API response:", response.status, rawText);
        if (response.status === 413) {
          throw new Error("The uploaded file exceeds the maximum server upload size. Please try a smaller audio file (under 25MB).");
        }
        throw new Error(
          rawText.includes("<!DOCTYPE") || rawText.includes("<html")
            ? `Server Error (${response.status}): Unable to process audio request.`
            : rawText || `Server returned error status ${response.status}`
        );
      }

      if (!response.ok) {
        if (response.status === 403 || data.limitReached) {
          setIsPricingModalOpen(true);
        }
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      setTranscription(data.text);
      await recordTranscriptionSuccess({
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        text: data.text,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    let waveData = Array(8)
      .fill(0)
      .map(() => ({
        value: Math.random() * 0.5 + 0.1,
        targetValue: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.02 + 0.01,
      }));

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const updateWaveData = () => {
      waveData.forEach((data) => {
        if (Math.random() < 0.01) {
          data.targetValue = Math.random() * 0.7 + 0.1;
        }
        const diff = data.targetValue - data.value;
        data.value += diff * data.speed;
      });
    };

    const draw = () => {
      ctx.fillStyle = theme === "light" ? "#f8fafc" : "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 8; i++) {
        const freq = waveData[i].value * 7.0;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 1) {
          const normalizedX = (x / canvas.width) * 2 - 1;
          let px = normalizedX + i * 0.04 + freq * 0.03;
          let py =
            Math.sin(px * 10 + time) *
            Math.cos(px * 2) *
            freq *
            0.1 *
            ((i + 1) / 8);
          const canvasY = ((py + 1) * canvas.height) / 2;

          if (x === 0) {
            ctx.moveTo(x, canvasY);
          } else {
            ctx.lineTo(x, canvasY);
          }
        }

        const intensity = Math.min(1, freq * 0.3);
        const r = theme === "light" ? 234 : 249 + intensity * 6;
        const g = theme === "light" ? 88 : 115 + intensity * 50;
        const b = theme === "light" ? 12 : 22;
        const alpha = theme === "light" ? 0.35 : 0.6;

        ctx.lineWidth = 1 + i * 0.3;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      time += 0.02;
      updateWaveData();
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 sm:py-10 relative overflow-x-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      />

      <div className="w-full relative max-w-4xl mx-auto z-10">
        <div className="relative card-border rounded-3xl flex flex-col p-6 sm:p-8 overflow-hidden bg-white/95 dark:bg-[#121214]/80 border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="flex flex-col items-center justify-center text-center mb-6 z-20 relative">
              <span className="inline-block px-3 py-1 text-orange-700 dark:text-orange-300 rounded-full text-xs font-bold mb-3 border border-orange-500/30 bg-orange-500/10">
                VoiceScribe Transcriber
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white mb-2.5 tracking-tight">
                Audio to Text in Seconds
              </h1>
              <p className="text-gray-800 dark:text-gray-300 max-w-lg text-sm sm:text-base font-medium leading-relaxed">
                Powered by Groq&apos;s insanely fast Whisper API. Drag and drop your audio or video file below to get a highly accurate English transcript instantly.
              </p>

              {/* Usage Quota Indicator */}
              <div className="mt-4 flex items-center gap-2">
                {isInfinite ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
                    <Crown className="w-3.5 h-3.5" />
                    Admin: Unlimited Transcriptions
                  </span>
                ) : isPro ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pro Plan: Unlimited Transcriptions
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-900 dark:text-orange-300 border border-orange-500/30">
                      <Zap className="w-3 h-3 fill-current text-orange-600 dark:text-orange-400" />
                      {remainingFreeUses > 0
                        ? `${remainingFreeUses} of 2 free transcriptions left`
                        : "Free limit reached (2/2 used)"}
                    </span>
                    {remainingFreeUses === 0 && (
                      <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline transition-colors cursor-pointer"
                      >
                        Upgrade for ₦2,000/mo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent mb-6 z-20 relative"></div>

            <div className="z-20 relative flex flex-col items-center w-full min-h-[300px]">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                isLoading={isTranscribing}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-400 w-full text-center max-w-2xl font-medium text-sm"
                >
                  {error}
                </motion.div>
              )}

              {file && !isTranscribing && !transcription && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center justify-center w-full gap-6"
                >
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={translate}
                        onChange={(e) => setTranslate(e.target.checked)}
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${translate ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${translate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                      Translate to English
                    </span>
                  </label>

                  {canTranscribe ? (
                    <button
                      onClick={handleTranscribe}
                      className="px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer"
                    >
                      Generate Transcript
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Free Limit Reached — Upgrade to Transcribe (₦2,000/mo)
                    </button>
                  )}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {isTranscribing && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-6"
                  >
                    <LoadingState />
                  </motion.div>
                )}

                {transcription && !isTranscribing && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="w-full mt-6"
                  >
                    <TranscriptionResult text={transcription} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 flex justify-center z-20 relative">
            <a
               href="https://bimex-group.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors text-xs font-semibold tracking-wide cursor-pointer"
            >
              built by bimex-group.vercel.app
            </a>
          </div>
      </div>
    </div>
  );
}
