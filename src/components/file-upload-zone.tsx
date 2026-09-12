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
    // Check if it's an audio or video file
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
          className="glass-panel p-6 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="bg-brand-500/20 p-3 rounded-xl">
              <FileAudio className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <p className="text-white font-medium truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          {!isLoading && (
            <button 
              onClick={clearFile}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-12 glass-panel rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            isDragActive 
              ? "border-brand-400 bg-brand-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
              : "border-white/10 hover:border-brand-500/50"
          }`}
        >
          {isDragActive && (
            <div className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
          )}
          
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept="audio/*,video/*"
          />
          
          <div className="bg-white/5 p-4 rounded-full mb-4">
            <UploadCloud className={`w-10 h-10 ${isDragActive ? "text-brand-400" : "text-gray-400"}`} />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            Click or drag & drop to upload
          </h3>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            Supported formats: MP3, WAV, MP4, M4A. Maximum file size: 25MB.
          </p>
        </motion.div>
      )}
    </div>
  );
}
