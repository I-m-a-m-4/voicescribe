// VoiceScribe Background Service Worker

const API_ENDPOINT = "https://usevoicescribe.vercel.app/api/transcribe";

// Create Context Menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "voicescribe-transcribe",
    title: "🎙️ Transcribe with VoiceScribe",
    contexts: ["audio", "link", "page", "selection"]
  });
  console.log("VoiceScribe context menu created.");
});

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "voicescribe-transcribe" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "VOICESCRIBE_START_TRANSCRIPTION",
      srcUrl: info.srcUrl || null,
      linkUrl: info.linkUrl || null,
    });
  }
});

// Handle API requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "VOICESCRIBE_TRANSCRIBE_BASE64") {
    handleTranscribeBase64(request.base64Data, request.mimeType || "audio/ogg", request.filename || "whatsapp_audio.ogg")
      .then((result) => sendResponse({ success: true, text: result.text }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleTranscribeBase64(base64Data, mimeType, filename) {
  // Convert base64 to Blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data;
}
