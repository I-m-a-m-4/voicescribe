import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

/**
 * Loads and returns a singleton instance of FFmpeg WASM.
 */
export async function getFFmpeg(onLog?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadingPromise;
}

/**
 * Extracts accurate media duration (in seconds) via HTML5 Audio/Video element.
 */
export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(0);
      return;
    }

    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mkv|mov|avi|webm|flv|wmv|m4v|3gp)$/i.test(file.name);
    const element = document.createElement(isVideo ? "video" : "audio");
    element.preload = "metadata";

    let settled = false;
    let objectUrl = "";

    const finish = (duration: number) => {
      if (!settled) {
        settled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(isFinite(duration) && duration > 0 ? duration : 0);
      }
    };

    element.onloadedmetadata = () => finish(element.duration || 0);
    element.onerror = () => finish(0);

    try {
      objectUrl = URL.createObjectURL(file);
      element.src = objectUrl;
    } catch {
      finish(0);
    }

    // Safety timeout in case metadata event never fires
    setTimeout(() => finish(0), 4000);
  });
}

/**
 * Format seconds into human-readable time (e.g. 57:12 or 1h 05m 20s).
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "0:00";
  const totalSecs = Math.round(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export interface ChunkResult {
  chunks: File[];
  totalDuration: number;
  isSegmented: boolean;
}

/**
 * Prepares audio for transcription.
 * - If file is already a short audio file (< 180s and < 20MB), returns it directly.
 * - If file is a video, extracts the audio track into a lightweight 16kHz mono 48kbps MP3.
 * - If duration exceeds segmentSeconds (default 180s = 3 minutes), splits audio into 3-minute chunks.
 */
export async function prepareAudioChunks(
  file: File,
  options?: {
    onStatus?: (status: string) => void;
    segmentSeconds?: number;
  }
): Promise<ChunkResult> {
  const segmentSeconds = options?.segmentSeconds || 180; // 3-minute chunks
  const isVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mkv|mov|avi|webm|flv|wmv|m4v|3gp)$/i.test(file.name);

  options?.onStatus?.("Checking media duration and format...");
  const duration = await getMediaDuration(file);

  // If already an audio file, under segment limit, and under 20MB, no FFmpeg needed!
  if (!isVideo && duration > 0 && duration <= segmentSeconds && file.size < 20 * 1024 * 1024) {
    return {
      chunks: [file],
      totalDuration: duration,
      isSegmented: false,
    };
  }

  // Otherwise, use FFmpeg WASM to extract/optimize and segment
  options?.onStatus?.("Initializing audio engine...");
  const ffmpeg = await getFFmpeg();

  const cleanBase = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const inputExt = file.name.split(".").pop() || (isVideo ? "mp4" : "mp3");
  const inputName = `input_${Date.now()}.${inputExt}`;
  const masterName = `master_${Date.now()}.mp3`;

  try {
    options?.onStatus?.(isVideo ? "Extracting audio track from video..." : "Optimizing audio bitrate for speech AI...");
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Convert to 16,000Hz mono 48kbps MP3 (Whisper's exact internal format)
    await ffmpeg.exec([
      "-i", inputName,
      "-vn",
      "-ac", "1",
      "-ar", "16000",
      "-c:a", "libmp3lame",
      "-b:a", "48k",
      masterName,
    ]);

    // Free original input from virtual memory
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {}

    // Check if we need chunking
    const needsChunking = duration > segmentSeconds || duration === 0;

    const toAudioBlob = (bytes: unknown): Blob => {
      return new Blob([bytes as any], { type: "audio/mpeg" });
    };

    if (!needsChunking) {
      // Single chunk is sufficient
      const masterBytes = await ffmpeg.readFile(masterName);
      const audioBlob = toAudioBlob(masterBytes);
      const readyFile = new File([audioBlob], `${cleanBase}.mp3`, { type: "audio/mpeg" });
      try {
        await ffmpeg.deleteFile(masterName);
      } catch {}

      return {
        chunks: [readyFile],
        totalDuration: duration,
        isSegmented: false,
      };
    }

    // Split into segments using fast stream copy (-f segment)
    options?.onStatus?.(`Splitting into ${formatDuration(segmentSeconds)} segments for fast AI processing...`);
    const segmentPattern = `chunk_%03d.mp3`;

    await ffmpeg.exec([
      "-i", masterName,
      "-f", "segment",
      "-segment_time", String(segmentSeconds),
      "-reset_timestamps", "1",
      "-c", "copy",
      segmentPattern,
    ]);

    // Read back all generated chunk files
    const chunks: File[] = [];
    let idx = 0;

    while (true) {
      const partName = `chunk_${String(idx).padStart(3, "0")}.mp3`;
      try {
        const chunkData = await ffmpeg.readFile(partName);
        const chunkBlob = toAudioBlob(chunkData);
        chunks.push(
          new File([chunkBlob], `${cleanBase}_part${idx + 1}.mp3`, { type: "audio/mpeg" })
        );
        try {
          await ffmpeg.deleteFile(partName);
        } catch {}
        idx++;
      } catch {
        // No more segments
        break;
      }
    }

    // Clean up master file
    try {
      await ffmpeg.deleteFile(masterName);
    } catch {}

    // If segmenting produced no chunks for any reason, fallback to master audio
    if (chunks.length === 0) {
      const fallbackBytes = await ffmpeg.readFile(masterName).catch(() => null);
      if (fallbackBytes) {
        const fallbackBlob = toAudioBlob(fallbackBytes);
        return {
          chunks: [new File([fallbackBlob], `${cleanBase}.mp3`, { type: "audio/mpeg" })],
          totalDuration: duration,
          isSegmented: false,
        };
      }
      return {
        chunks: [file],
        totalDuration: duration,
        isSegmented: false,
      };
    }

    return {
      chunks,
      totalDuration: duration,
      isSegmented: chunks.length > 1,
    };
  } catch (err) {
    console.error("FFmpeg processing error:", err);
    // Cleanup temporary files
    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(masterName); } catch {}
    // Fallback: Return original file
    return {
      chunks: [file],
      totalDuration: duration,
      isSegmented: false,
    };
  }
}
