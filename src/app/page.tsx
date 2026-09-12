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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setTranscription(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;

    // Limit check: if user has exhausted free limit and is not admin/pro
    if (!canTranscribe) {
      setIsPricingModalOpen(true);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscription(null);

    const formData = new FormData();
    formData.append("file", file);
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

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 || data.limitReached) {
          setIsPricingModalOpen(true);
        }
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      setTranscription(data.text);

      // Record successful usage (handles popup after 1st generation for guest)
      await recordTranscriptionSuccess();
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

    // Wave state
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
      ctx.fillStyle = theme === "light" ? "#ffffff" : "#09090b";
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
        const r = 249 + intensity * 6;
        const g = 115 + intensity * 50;
        const b = 22;

        ctx.lineWidth = 1 + i * 0.3;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
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
    <div className="bg-transparent m-0 p-0 overflow-hidden min-h-screen w-full relative">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      />

      <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 z-10 pt-20">
        <div className="w-full relative max-w-4xl mx-auto my-auto">
          <div className="relative card-border rounded-2xl flex flex-col p-6 overflow-hidden bg-white/50 dark:bg-transparent">
            <div className="flex flex-col items-center justify-center text-center mb-6 z-20 relative">
              <span className="inline-block px-3 py-1 glass text-orange-600 dark:text-orange-300 rounded-full text-xs font-medium mb-3 border border-orange-400/30 bg-white/50 dark:bg-transparent">
                VoiceScribe Transcriber
              </span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                Audio to Text in Seconds
              </h1>
              <p className="text-gray-600 dark:text-white/70 max-w-lg text-sm">
                Powered by Groq&apos;s insanely fast Whisper API. Drag and drop your audio or video file below to get a highly accurate English transcript instantly.
              </p>

              {/* Usage Quota Indicator */}
              <div className="mt-3 flex items-center gap-2">
                {isInfinite ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Crown className="w-3.5 h-3.5" />
                    Admin: Unlimited Transcriptions
                  </span>
                ) : isPro ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pro Plan: Unlimited Transcriptions
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      <Zap className="w-3 h-3 fill-current" />
                      {remainingFreeUses > 0
                        ? `${remainingFreeUses} of 2 free transcriptions left`
                        : "Free limit reached (2/2 used)"}
                    </span>
                    {remainingFreeUses === 0 && (
                      <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="text-xs font-semibold text-orange-500 hover:text-orange-400 underline transition-colors"
                      >
                        Upgrade for ₦1,000
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/30 to-transparent mb-6 z-20 relative"></div>

            <div className="z-20 relative flex flex-col items-center w-full min-h-[300px]">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                isLoading={isTranscribing}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 w-full text-center max-w-2xl"
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
                  {canTranscribe ? (
                    <button
                      onClick={handleTranscribe}
                      className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    >
                      Generate Transcript
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    >
                      <Lock className="w-4 h-4" />
                      Free Limit Reached — Upgrade to Transcribe (₦1,000)
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

          <div className="mt-8 flex justify-center z-20 relative">
            <a
              href="https://bimex-group.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500/60 hover:text-orange-400 transition-colors text-xs tracking-wide"
            >
              built by bimex-group.vercel.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
