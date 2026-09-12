// VoiceScribe WhatsApp Web & Universal Web Audio Transcriber
let lastRightClickedElement = null;

// Track last clicked element for context menu
document.addEventListener("contextmenu", (e) => {
  lastRightClickedElement = e.target;
}, true);

// Listen for context menu command from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "VOICESCRIBE_START_TRANSCRIPTION") {
    handleContextMenuTrigger(request.srcUrl);
  }
});

function findAudioFromElement(element) {
  if (!element) return null;

  // Direct audio element
  if (element.tagName === "AUDIO") return element;

  // Check parent message bubble / row
  const bubble = element.closest("[data-id], .message-in, .message-out, div[role='row'], div[role='region']") || element.closest("div");
  if (bubble) {
    const audio = bubble.querySelector("audio");
    if (audio) return audio;
  }

  // Fallback: Check if there's any active/playing or recently loaded audio
  const audios = Array.from(document.querySelectorAll("audio"));
  if (audios.length > 0) {
    const playing = audios.find((a) => !a.paused);
    if (playing) return playing;
    return audios[audios.length - 1];
  }

  return null;
}

async function handleContextMenuTrigger(srcUrl) {
  let audioUrl = srcUrl;

  if (!audioUrl && lastRightClickedElement) {
    const audio = findAudioFromElement(lastRightClickedElement);
    if (audio && audio.src) {
      audioUrl = audio.src;
    }
  }

  if (!audioUrl) {
    // Check if any audio exists in document
    const anyAudio = document.querySelector("audio");
    if (anyAudio && anyAudio.src) {
      audioUrl = anyAudio.src;
    }
  }

  if (!audioUrl) {
    showHudError("No audio found. Right-click directly on the voice note player or play it once first.");
    return;
  }

  processAudioUrl(audioUrl);
}

async function processAudioUrl(url) {
  try {
    showHudLoading("Extracting voice note...");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Could not retrieve audio stream from page.");
    }

    const blob = await response.blob();
    const mimeType = blob.type || "audio/ogg";

    showHudLoading("Transcribing with Groq Whisper AI (~1.5s)...");

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];

      chrome.runtime.sendMessage(
        {
          action: "VOICESCRIBE_TRANSCRIBE_BASE64",
          base64Data: base64Data,
          mimeType: mimeType,
          filename: "whatsapp_audio.ogg",
        },
        (res) => {
          if (res && res.success && res.text) {
            // Auto copy to clipboard
            try {
              navigator.clipboard.writeText(res.text);
            } catch (e) {
              console.log("Clipboard write fallback:", e);
            }
            showHudSuccess(res.text);
          } else {
            showHudError(res?.error || "Failed to transcribe audio.");
          }
        }
      );
    };
    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("VoiceScribe error:", err);
    showHudError(err.message || "Could not read audio data.");
  }
}

// UI HUD Injection
function getOrCreateHud() {
  let container = document.getElementById("voicescribe-hud-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "voicescribe-hud-container";
    document.body.appendChild(container);
  }
  return container;
}

function showHudLoading(message) {
  const container = getOrCreateHud();
  container.innerHTML = `
    <div class="voicescribe-hud">
      <div class="voicescribe-hud-header">
        <div class="voicescribe-brand">
          <span>🎙️ VoiceScribe AI</span>
        </div>
        <button class="voicescribe-close-btn" id="vs-hud-close">&times;</button>
      </div>
      <div class="voicescribe-hud-body">
        <div class="voicescribe-loading">
          <div class="voicescribe-spinner"></div>
          <span>${message}</span>
        </div>
      </div>
    </div>
  `;
  attachHudClose();
}

function showHudSuccess(text) {
  const container = getOrCreateHud();
  container.innerHTML = `
    <div class="voicescribe-hud">
      <div class="voicescribe-hud-header">
        <div class="voicescribe-brand">
          <span>🎙️ VoiceScribe Transcription</span>
        </div>
        <button class="voicescribe-close-btn" id="vs-hud-close">&times;</button>
      </div>
      <div class="voicescribe-hud-body">
        ${escapeHtml(text)}
      </div>
      <div class="voicescribe-hud-footer">
        <span class="voicescribe-status-tag">
          ✓ Copied to clipboard
        </span>
        <button class="voicescribe-btn" id="vs-copy-btn">
          Copy Again
        </button>
      </div>
    </div>
  `;
  attachHudClose();

  const copyBtn = document.getElementById("vs-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy Again"; }, 2000);
    });
  }
}

function showHudError(errorMsg) {
  const container = getOrCreateHud();
  container.innerHTML = `
    <div class="voicescribe-hud" style="border-color: rgba(239, 68, 68, 0.4);">
      <div class="voicescribe-hud-header">
        <div class="voicescribe-brand" style="color: #ef4444;">
          <span>⚠️ VoiceScribe Notice</span>
        </div>
        <button class="voicescribe-close-btn" id="vs-hud-close">&times;</button>
      </div>
      <div class="voicescribe-hud-body" style="color: #fca5a5;">
        ${escapeHtml(errorMsg)}
      </div>
    </div>
  `;
  attachHudClose();
}

function attachHudClose() {
  const closeBtn = document.getElementById("vs-hud-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const container = document.getElementById("voicescribe-hud-container");
      if (container) container.innerHTML = "";
    });
  }
}

function escapeHtml(string) {
  const div = document.createElement("div");
  div.innerText = string;
  return div.innerHTML;
}

// Auto-inject convenient "🎙️ Transcribe" badge on WhatsApp Web audio players
function injectWhatsAppBadges() {
  if (!window.location.hostname.includes("whatsapp.com")) return;

  const audios = document.querySelectorAll("audio");
  audios.forEach((audio) => {
    const parentBubble = audio.closest("div[role='row'], .message-in, .message-out") || audio.parentElement;
    if (parentBubble && !parentBubble.querySelector(".voicescribe-wa-btn")) {
      const btn = document.createElement("button");
      btn.className = "voicescribe-wa-btn";
      btn.innerHTML = "🎙️ Transcribe";
      btn.title = "Transcribe this voice note with VoiceScribe AI";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (audio.src) {
          processAudioUrl(audio.src);
        } else {
          showHudError("Audio not loaded yet. Click play once then transcribe.");
        }
      });
      parentBubble.appendChild(btn);
    }
  });
}

// Observe WhatsApp DOM for new voice notes
const observer = new MutationObserver(() => {
  injectWhatsAppBadges();
});
observer.observe(document.body, { childList: true, subtree: true });
