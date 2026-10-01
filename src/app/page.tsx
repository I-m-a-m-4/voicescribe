"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import FileUploadZone from "@/components/file-upload-zone";
import LoadingState from "@/components/loading-state";
import TranscriptionResult from "@/components/transcription-result";
import { useAuth } from "@/context/auth-context";
import { prepareAudioChunks, formatDuration } from "@/lib/media-processor";
import { Sparkles, Crown, Zap, Lock, ArrowUpRight } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translate, setTranslate] = useState(false);

  // Multi-segment progress states
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("Processing audio...");
  const [currentSegment, setCurrentSegment] = useState<number>(1);
  const [totalSegments, setTotalSegments] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const {
    user,
    isPro,
    planTier,
    maxDurationMinutes,
    isInfinite,
    remainingFreeUses,
    canTranscribe,
    setIsPricingModalOpen,
    setPricingModalNotice,
    recordTranscriptionSuccess,
  } = useAuth();

  const handleFileSelect = (selectedFile: File | null, duration?: number) => {
    setFile(selectedFile);
    setFileDuration(duration || 0);
    setError(null);
    setTranscription(null);
  };

  const isOverDurationLimit =
    !isInfinite && fileDuration > 0 && fileDuration > maxDurationMinutes * 60;

  const handleTranscribe = async () => {
    if (!file) return;

    if (!canTranscribe) {
      setPricingModalNotice("You have reached your 2 free transcriptions. Choose a plan to continue.");
      setIsPricingModalOpen(true);
      return;
    }

    if (isOverDurationLimit) {
      const formatted = formatDuration(fileDuration);
      if (fileDuration > 20 * 60) {
        setPricingModalNotice(
          `Your file is ${formatted} long. Upgrade to the Business Plan (up to 90 mins) to transcribe it.`
        );
      } else {
        setPricingModalNotice(
          `Your file is ${formatted} long. Upgrade to Creator (20 mins) or Business (90 mins) to transcribe it.`
        );
      }
      setIsPricingModalOpen(true);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscription(null);
    setProgressPercent(5);
    setTranscriptionStatus("Preparing and checking media format...");

    try {
      // Step 1: Chunk media into 3-minute segments (180s)
      const { chunks, isSegmented } = await prepareAudioChunks(file, {
        onStatus: (msg) => setTranscriptionStatus(msg),
        segmentSeconds: 180, // 3-minute segments
      });

      setTotalSegments(chunks.length);

      const isTauri =
        (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined) ||
        window.location.protocol === "tauri:";
      const apiUrl = isTauri
        ? "https://usevoicescribe.vercel.app/api/transcribe"
        : "/api/transcribe";

      let accumulatedText = "";

      // Step 2: Sequentially transcribe each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setCurrentSegment(i + 1);

        const currentPct = Math.round((i / chunks.length) * 85) + 10;
        setProgressPercent(currentPct);

        setTranscriptionStatus(
          chunks.length > 1
            ? `Transcribing segment ${i + 1} of ${chunks.length} (${currentPct}%)...`
            : "Transcribing with VoiceScribe Speech Engine..."
        );

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("translate", translate.toString());
        if (user?.email) formData.append("email", user.email);
        if (user?.uid) formData.append("uid", user.uid);

        const response = await fetch(apiUrl, {
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
            throw new Error("Segment exceeded server limits. Please try a smaller file.");
          }
          throw new Error(
            rawText.includes("<!DOCTYPE") || rawText.includes("<html")
              ? `Server Error (${response.status}): Transcription service unreachable.`
              : rawText || `Server returned error status ${response.status}`
          );
        }

        if (!response.ok) {
          if (response.status === 403 || data.limitReached) {
            setIsPricingModalOpen(true);
          }
          throw new Error(data.error || `Failed to transcribe segment ${i + 1}`);
        }

        if (data.text) {
          accumulatedText = accumulatedText
            ? `${accumulatedText} ${data.text.trim()}`
            : data.text.trim();
          // Real-time progressive transcription update!
          setTranscription(accumulatedText);
        }
      }

      setProgressPercent(100);
      setTranscriptionStatus("Transcription complete!");

      // Record 1 consolidated transcription success in history
      await recordTranscriptionSuccess({
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        text: accumulatedText,
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
        const amp = 40 + i * 15;
        const speed = 0.008 + i * 0.002;
        const yOffset = canvas.height * (0.35 + i * 0.04);

        ctx.beginPath();
        ctx.moveTo(0, yOffset);

        for (let x = 0; x < canvas.width; x += 10) {
          const y =
            yOffset +
            Math.sin(x * 0.002 * freq + time * speed) * amp +
            Math.cos(x * 0.001 + time * speed * 0.5) * (amp * 0.5);
          ctx.lineTo(x, y);
        }

        const alpha = (0.04 + i * 0.015) * (theme === "light" ? 0.8 : 1.2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      time += 1;
      updateWaveData();
      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      />

      <div className="w-full relative max-w-4xl mx-auto z-10">
        <div className="relative card-border rounded-xl flex flex-col p-6 sm:p-8 overflow-hidden bg-white/95 dark:bg-[#121214]/80 border border-dashed border-orange-500/35 dark:border-orange-500/35 shadow-2xl">
          <div className="flex flex-col items-center justify-center text-center mb-6 z-20 relative">
            <span className="inline-block px-3 py-1 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-bold mb-3 border border-dashed border-orange-500/35 bg-orange-500/10">
              VoiceScribe Smart Segment Transcriber
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white mb-2.5 tracking-tight">
              Audio &amp; Video to Text in Seconds
            </h1>
            <p className="text-gray-800 dark:text-gray-300 max-w-lg text-sm sm:text-base font-medium leading-relaxed">
              Powered by VoiceScribe&apos;s ultra-fast Speech Engine with automatic 3-minute chunking.
              Transcribe voice notes, lectures, and 57+ minute videos seamlessly.
            </p>

            {/* Usage Quota & Plan Indicator */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {isInfinite ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-dashed border-amber-500/35">
                    <Crown className="w-3.5 h-3.5" />
                    Admin: Unlimited Transcriptions (180m max)
                  </span>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Open Admin Analytics ↗
                  </Link>
                </div>
              ) : isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-dashed border-emerald-500/35">
                  <Sparkles className="w-3.5 h-3.5" />
                  {planTier === "business" ? "Business Plan (Up to 90m)" : "Creator Plan (Up to 20m)"}:
                  Unlimited Uses
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/15 text-orange-900 dark:text-orange-300 border border-dashed border-orange-500/35">
                    <Zap className="w-3 h-3 fill-current text-orange-600 dark:text-orange-400" />
                    {remainingFreeUses > 0
                      ? `${remainingFreeUses} of 2 free uses left (5m limit)`
                      : "Free limit reached (2/2 used)"}
                  </span>
                  {remainingFreeUses === 0 && (
                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline transition-colors cursor-pointer"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px border-b border-dashed border-gray-300 dark:border-white/15 mb-6 z-20 relative"></div>

          <div className="z-20 relative flex flex-col items-center w-full min-h-[300px]">
            <FileUploadZone
              onFileSelect={handleFileSelect}
              isLoading={isTranscribing}
              selectedDuration={fileDuration}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-lg bg-red-500/15 border border-dashed border-red-500/40 text-red-700 dark:text-red-400 w-full text-center max-w-2xl font-medium text-sm"
              >
                {error}
              </motion.div>
            )}

            {file && !isTranscribing && !transcription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex flex-col items-center justify-center w-full gap-5"
              >
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={translate}
                      onChange={(e) => setTranslate(e.target.checked)}
                    />
                    <div
                      className={`w-10 h-6 rounded-full transition-colors ${
                        translate ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        translate ? "translate-x-4" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                    Translate to English
                  </span>
                </label>

                {isOverDurationLimit ? (
                  <button
                    onClick={() => {
                      const formatted = formatDuration(fileDuration);
                      if (fileDuration > 20 * 60) {
                        setPricingModalNotice(
                          `Your file is ${formatted} long. Upgrade to Business (up to 90 mins) to transcribe.`
                        );
                      } else {
                        setPricingModalNotice(
                          `Your file is ${formatted} long. Upgrade to Creator (20 mins) or Business (90 mins) to transcribe.`
                        );
                      }
                      setIsPricingModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Upgrade Plan to Transcribe ({formatDuration(fileDuration)} exceeds {maxDurationMinutes}m limit)
                  </button>
                ) : canTranscribe ? (
                  <button
                    onClick={handleTranscribe}
                    className="px-8 py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer"
                  >
                    Generate Transcript
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPricingModalNotice(
                        "You have reached your 2 free transcriptions. Choose a plan to continue."
                      );
                      setIsPricingModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    Free Limit Reached — Upgrade to Transcribe (From ₦5,000/mo)
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
                  <LoadingState
                    title={totalSegments > 1 ? "Transcribing Multi-Segment Media..." : "Processing audio..."}
                    statusMessage={transcriptionStatus}
                    currentSegment={currentSegment}
                    totalSegments={totalSegments}
                    progressPercent={progressPercent}
                  />
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
