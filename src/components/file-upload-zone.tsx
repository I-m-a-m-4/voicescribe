"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileAudio, X } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function FileUploadZone({ onFileSelect, isLoading }: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        handleFile(file);
      }
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Please upload an audio or video file.");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {selectedFile ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/15 p-3 rounded-xl">
              <FileAudio className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          {!isLoading && (
            <button 
              onClick={clearFile}
              className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
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
            <UploadCloud className={`w-10 h-10 ${isDragActive ? "text-orange-500" : "text-orange-600 dark:text-orange-400"}`} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Click or drag &amp; drop to upload
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium text-center max-w-sm">
            Supported formats: MP3, WAV, MP4, M4A. Maximum file size: 25MB.
          </p>
        </motion.div>
      )}
    </div>
  );
}
