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
  if (element.tagName === "AUDIO" && element.src) return element;

  // Check element itself
  const directAudio = element.querySelector && element.querySelector("audio");
  if (directAudio && directAudio.src) return directAudio;

  // Check parent message bubble / row
  const bubble = element.closest("[data-id], .message-in, .message-out, div[role='row'], div[role='region'], div[tabindex='-1']") || element.closest("div");
  if (bubble) {
    const audio = bubble.querySelector("audio");
    if (audio && audio.src) return audio;
  }

  // Fallback: Check if there's any active/playing audio on page
  const audios = Array.from(document.querySelectorAll("audio")).filter((a) => a.src);
  if (audios.length > 0) {
    const playing = audios.find((a) => !a.paused);
    if (playing) return playing;
    return audios[audios.length - 1]; // Return most recently loaded
  }

  return null;
}

async function handleContextMenuTrigger(srcUrl) {
  let audioUrl = srcUrl;

  if (!audioUrl && lastRightClickedElement) {
    let audio = findAudioFromElement(lastRightClickedElement);
    
    // If not found yet, try clicking play on the voice note to trigger WhatsApp's audio loader
    if (!audio) {
      const playBtn = lastRightClickedElement.closest("div[role='row'], .message-in, .message-out, div")?.querySelector("button, [role='button'], span[data-icon='audio-play'], [data-testid='audio-play']");
      if (playBtn) {
        playBtn.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        audio = findAudioFromElement(lastRightClickedElement);
      }
    }

    if (audio && audio.src) {
      audioUrl = audio.src;
    }
  }

  if (!audioUrl) {
    // Check if any audio exists anywhere in document
    const anyAudio = Array.from(document.querySelectorAll("audio")).find((a) => a.src);
    if (anyAudio && anyAudio.src) {
      audioUrl = anyAudio.src;
    }
  }

  if (!audioUrl) {
    showHudError("No audio found. Click play on the voice note once, then right-click to transcribe.");
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

  // Find all audio elements or play buttons in WhatsApp
  const voiceContainers = document.querySelectorAll(
    "div[role='row'] audio, .message-in audio, .message-out audio, [data-icon='audio-play'], [data-testid='audio-play'], [data-icon='audio-pause'], [data-testid='audio-pause']"
  );

  voiceContainers.forEach((item) => {
    const parentBubble = item.closest("div[role='row'], .message-in, .message-out") || item.closest("div");
    if (parentBubble && !parentBubble.querySelector(".voicescribe-wa-btn")) {
      const btn = document.createElement("button");
      btn.className = "voicescribe-wa-btn";
      btn.innerHTML = "🎙️ Transcribe";
      btn.title = "Transcribe this voice note with VoiceScribe AI";
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        let audio = parentBubble.querySelector("audio");
        if (!audio || !audio.src) {
          // Trigger play button to load audio blob
          const playBtn = parentBubble.querySelector("button, [role='button'], [data-icon='audio-play'], [data-testid='audio-play']");
          if (playBtn) {
            playBtn.click();
            await new Promise((resolve) => setTimeout(resolve, 500));
            audio = parentBubble.querySelector("audio");
          }
        }

        if (audio && audio.src) {
          processAudioUrl(audio.src);
        } else {
          showHudError("Audio is still buffering. Click play once then transcribe.");
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
// Run once on initial load
setTimeout(injectWhatsAppBadges, 2000);
