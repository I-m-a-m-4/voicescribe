"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  X,
  Mic,
  Square,
  Volume2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { getMediaDuration, formatDuration } from "@/lib/media-processor";
import { useAuth } from "@/context/auth-context";

interface FileUploadZoneProps {
  onFileSelect: (file: File | null, duration?: number) => void;
  isLoading: boolean;
  selectedDuration?: number | null;
}

export default function FileUploadZone({
  onFileSelect,
  isLoading,
  selectedDuration,
}: FileUploadZoneProps) {
  const { maxDurationMinutes, planTier, setIsPricingModalOpen, setPricingModalNotice, isInfinite } =
    useAuth();

  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload");
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up object URLs and recording streams
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name);
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mkv|mov|avi|webm|flv|wmv|m4v|3gp)$/i.test(file.name);

    if (!isAudio && !isVideo) {
      alert("Please upload an audio or video file (MP3, WAV, MP4, MKV, etc.).");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setIsDetectingDuration(true);
    try {
      const detectedDuration = await getMediaDuration(file);
      setDuration(detectedDuration);

      if (isAudio) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      setSelectedFile(file);
      onFileSelect(file, detectedDuration);
    } finally {
      setIsDetectingDuration(false);
    }
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDuration(0);
    onFileSelect(null, 0);
  };

  // --- Microphone Recording Functions ---
  const startRecording = async () => {
    setRecordError(null);
    clearFile();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([audioBlob], `voice_recording_${Date.now()}.${ext}`, {
          type: mimeType,
        });

        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        setSelectedFile(file);

        const dur = recordDuration || (await getMediaDuration(file));
        setDuration(dur);
        onFileSelect(file, dur);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setRecordError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was blocked. Please grant microphone permissions in your browser URL bar."
          : err.message || "Failed to start microphone recording."
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isVideo = selectedFile
    ? selectedFile.type.startsWith("video/") ||
      /\.(mp4|mkv|mov|avi|webm|flv|wmv|m4v)$/i.test(selectedFile.name)
    : false;

  const currentDuration = selectedDuration || duration;
  const isOverDurationLimit =
    !isInfinite && currentDuration > 0 && currentDuration > maxDurationMinutes * 60;

  const handleUpgradePrompt = () => {
    const formatted = formatDuration(currentDuration);
    if (currentDuration > 20 * 60) {
      setPricingModalNotice(
        `Your file is ${formatted} long. Upgrade to the Business Plan (up to 90 mins) to transcribe it.`
      );
    } else {
      setPricingModalNotice(
        `Your file is ${formatted} long. Upgrade to Creator (20 mins) or Business (90 mins) to transcribe it.`
      );
    }
    setIsPricingModalOpen(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode Switch Tabs */}
      {!selectedFile && !isRecording && (
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/15 shadow-sm">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Audio / Video File
            </button>
            <button
              onClick={() => setActiveTab("record")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "record"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <Mic className="w-4 h-4 text-orange-400" />
              Record with Microphone
            </button>
          </div>
        </div>
      )}

      {/* Selected File Card */}
      {selectedFile ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-xl border border-dashed border-gray-300 dark:border-white/20 shadow-xl bg-white/90 dark:bg-[#121214]/90"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/15 p-3 rounded-xl border border-dashed border-orange-500/30 text-orange-600 dark:text-orange-400 flex-shrink-0">
                {isVideo ? <FileVideo className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />}
              </div>
              <div className="min-w-0">
                <p className="text-gray-950 dark:text-white font-bold text-base truncate max-w-[220px] sm:max-w-[340px]">
                  {selectedFile.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>&bull;</span>
                  <span className="capitalize">{isVideo ? "Video Track" : "Audio"}</span>
                  {currentDuration > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(currentDuration)}
                      </span>
                    </>
                  )}
                  {isDetectingDuration && (
                    <span className="text-[11px] text-gray-400 animate-pulse">
                      Analyzing length...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isLoading && (
              <button
                onClick={clearFile}
                className="p-2.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                title="Remove and choose another file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Over Duration Limit Warning */}
          {/* Over Duration Limit Warning */}
          {isOverDurationLimit && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    File exceeds your {planTier === "free" ? "Free" : "Creator"} limit (
                    {maxDurationMinutes}m max).
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    File length: <strong>{formatDuration(currentDuration)}</strong>. Upgrade to{" "}
                    {currentDuration > 20 * 60 ? "Business (up to 90m)" : "Creator / Business"} to
                    transcribe.
                  </p>
                </div>
              </div>

              <button
                onClick={handleUpgradePrompt}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-orange-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade Plan
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Audio Player Preview */}
          {previewUrl && !isOverDurationLimit && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  Listen to Audio Preview
                </span>
                <span className="text-[11px] text-gray-500 font-medium">Playback preview</span>
              </div>
              <audio
                controls
                src={previewUrl}
                className="w-full h-10 rounded-lg focus:outline-none"
                preload="metadata"
              />
            </div>
          )}
        </motion.div>
      ) : activeTab === "record" || isRecording ? (
        /* --- Microphone Recording Interface --- */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-10 glass-panel rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-center flex flex-col items-center justify-center relative overflow-hidden"
        >
          {isRecording ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <span className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute -inset-8 rounded-full bg-red-500/10 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                  <Mic className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-red-500/15 text-red-700 dark:text-red-400 font-bold text-xs mb-2 border border-dashed border-red-500/35">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                RECORDING LIVE
              </div>

              <div className="text-4xl font-mono font-extrabold text-gray-950 dark:text-white mb-6 tracking-wider">
                {formatTime(recordDuration)}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-sm mb-6">
                Speak clearly into your microphone. When you are finished, click the stop button below.
              </p>

              <button
                onClick={stopRecording}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-orange-500/10 border border-dashed border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-1">
                Record Voice Memo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mb-6">
                Capture lectures, voice notes, or interviews directly using your browser microphone.
              </p>

              {recordError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-dashed border-red-500/30 text-red-500 text-xs font-medium max-w-sm">
                  {recordError}
                </div>
              )}

              <button
                onClick={startRecording}
                className="flex items-center gap-2.5 px-7 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-600/25 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* --- Drag and Drop File Upload Area --- */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
            isDragActive
              ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
              : "border-gray-300 dark:border-white/15 hover:border-orange-500/50 bg-white/40 dark:bg-white/[0.02]"
          }`}
        >
          <input
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.mkv,.mov,.avi,.webm"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-orange-500/20 to-orange-500/5 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 shadow-sm border border-dashed border-orange-500/35">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-1">
            Choose audio or video file
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-3">
            Drag and drop or browse from your computer
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 font-semibold">
              MP3, WAV, M4A
            </span>
            <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 font-semibold">
              MP4, MKV, MOV
            </span>
            <span className="px-2 py-0.5 rounded-md border border-dashed border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
              Auto 3-Min Segments
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
