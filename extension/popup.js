const DEFAULT_URL = 'https://usevoicescribe.vercel.app';
const appFrame = document.getElementById('appFrame');
const serverSelect = document.getElementById('serverSelect');
const openMiniWindowBtn = document.getElementById('openMiniWindowBtn');
const openTabBtn = document.getElementById('openTabBtn');
const brandLink = document.getElementById('brandLink');
const offlineCard = document.getElementById('offlineCard');
const retryMiniBtn = document.getElementById('retryMiniBtn');
const retryTabBtn = document.getElementById('retryTabBtn');

// Always prioritize the live cloud URL unless user specifically switched to localhost
let targetUrl = localStorage.getItem('voicescribe_ext_url');
if (!targetUrl || targetUrl.includes('voicescribe.vercel.app') || targetUrl.includes('localhost')) {
    if (!targetUrl || targetUrl.includes('voicescribe.vercel.app')) {
        targetUrl = DEFAULT_URL;
    }
}

if (serverSelect) {
    serverSelect.value = targetUrl;
    serverSelect.addEventListener('change', (e) => {
        const url = e.target.value;
        localStorage.setItem('voicescribe_ext_url', url);
        if (appFrame) appFrame.src = url;
        if (offlineCard) offlineCard.classList.remove('visible');
    });
}

if (appFrame) {
    appFrame.src = targetUrl;
    appFrame.addEventListener('load', () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        if (offlineCard) offlineCard.classList.remove('visible');
    });
}

// Open in floating mini popup window (ideal for Brave microphone permission & Google OAuth)
const openMiniWindow = () => {
    const url = (serverSelect && serverSelect.value) ? serverSelect.value : DEFAULT_URL;
    if (typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({
            url: url,
            type: 'popup',
            width: 480,
            height: 720,
            focused: true
        });
    } else {
        window.open(url, 'VoiceScribeMini', 'width=480,height=720,menubar=no,toolbar=no,location=no');
    }
};

// Open in full browser tab
const openInNewTab = () => {
    const url = (serverSelect && serverSelect.value) ? serverSelect.value : DEFAULT_URL;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: url });
    } else {
        window.open(url, '_blank');
    }
};

if (openMiniWindowBtn) openMiniWindowBtn.addEventListener('click', openMiniWindow);
if (retryMiniBtn) retryMiniBtn.addEventListener('click', openMiniWindow);
if (openTabBtn) openTabBtn.addEventListener('click', openInNewTab);
if (retryTabBtn) retryTabBtn.addEventListener('click', openInNewTab);
if (brandLink) {
    brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        openMiniWindow();
    });
}

// Offline / Shield fallback detection
let loadTimeout = setTimeout(() => {
    try {
        if (appFrame && !appFrame.contentWindow) {
            if (offlineCard) offlineCard.classList.add('visible');
        }
    } catch (err) {
        // Cross-origin loaded is actually successful
    }
}, 5000);
