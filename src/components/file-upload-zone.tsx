"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileAudio,
  X,
  Mic,
  Square,
  RotateCcw,
  Volume2,
  Radio,
  Sparkles,
} from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  isLoading: boolean;
}

export default function FileUploadZone({ onFileSelect, isLoading }: FileUploadZoneProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload");
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Please upload an audio or video file.");
    }
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    onFileSelect(null);
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

      // Select supported audio mime type
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([audioBlob], `voice_recording_${Date.now()}.${ext}`, {
          type: mimeType,
        });

        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        setSelectedFile(file);
        onFileSelect(file);

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordDuration(0);

      // Start duration counter
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode Switch Tabs */}
      {!selectedFile && !isRecording && (
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Audio File
            </button>
            <button
              onClick={() => setActiveTab("record")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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

      {/* Selected / Recorded File Card with Audio Player */}
      {selectedFile ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl bg-white/90 dark:bg-[#121214]/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/15 p-3.5 rounded-2xl text-orange-600 dark:text-orange-400">
                <FileAudio className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-950 dark:text-white font-bold text-base truncate max-w-[220px] sm:max-w-[340px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Audio Ready
                </p>
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

          {/* Integrated HTML5 Audio Player Preview */}
          {previewUrl && (
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  Listen to Audio Preview
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Playback controls
                </span>
              </div>
              <audio
                controls
                src={previewUrl}
                className="w-full h-10 rounded-xl focus:outline-none"
                preload="metadata"
              />
            </div>
          )}
        </motion.div>
      ) : activeTab === "record" || isRecording ? (
        /* --- Live Microphone Recording Interface --- */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-10 glass-panel rounded-3xl border border-gray-200 dark:border-white/15 text-center flex flex-col items-center justify-center relative overflow-hidden"
        >
          {isRecording ? (
            <div className="flex flex-col items-center">
              {/* Pulsing Recording Visualizer */}
              <div className="relative mb-6">
                <span className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute -inset-8 rounded-full bg-red-500/10 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                  <Mic className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 font-bold text-xs mb-2 border border-red-500/30">
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
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={startRecording}
                className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform cursor-pointer mb-6"
                title="Click to start recording"
              >
                <Mic className="w-9 h-9" />
              </button>

              <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-1.5">
                Record Voice Note
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-sm mb-6">
                Click the microphone button to record your speech, meeting, or voice note.
              </p>

              {recordError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium max-w-md mb-4">
                  {recordError}
                </div>
              )}

              <button
                onClick={startRecording}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20 cursor-pointer transition-all"
              >
                Start Recording
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* --- Drag and Drop File Upload Area --- */
        <motion.div
          whileHover={{ scale: 1.005 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-12 glass-panel rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            isDragActive
              ? "border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
              : "border-gray-300 dark:border-white/15 hover:border-orange-500/60"
          }`}
        >
          {isDragActive && (
            <div className="absolute inset-0 bg-orange-500/5 pointer-events-none" />
          )}

          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept="audio/*,video/*"
          />

          <div className="bg-orange-500/10 dark:bg-white/5 p-4 rounded-full mb-4">
            <UploadCloud
              className={`w-10 h-10 ${
                isDragActive ? "text-orange-500" : "text-orange-600 dark:text-orange-400"
              }`}
            />
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Click or drag &amp; drop to upload
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium text-center max-w-sm">
            Supported formats: MP3, WAV, MP4, M4A, OGG. Maximum file size: 25MB.
          </p>
        </motion.div>
      )}
    </div>
  );
}
