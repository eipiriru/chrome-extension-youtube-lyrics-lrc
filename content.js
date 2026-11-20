// content.js

// 1. Buat elemen Widget UI
const widgetHTML = `
  <div id="yt-lyrics-widget" style="display:none; flex-direction:column; position:fixed; top:80px; left:calc(100vw - min(720px, calc(100vw - 32px)) - 20px); width:min(675px, calc(100vw - 32px)); height:400px; min-width:min(320px, calc(100vw - 24px)); min-height:180px; max-width:calc(100vw - 24px); max-height:calc(100vh - 100px); background:#181818; border:1px solid #333; border-radius:10px; z-index:999999; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:'Segoe UI',Tahoma,sans-serif; overflow:hidden; resize:both;">
    <div id="yt-lyrics-header" style="background:#202020; padding:12px; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border-bottom:1px solid #333;">
      <div style="display:flex; align-items:center; gap:8px; min-height:30px; color:#bbb; user-select:none;">
        <span id="yt-lyrics-drag-handle" title="Seret untuk memindahkan widget" aria-label="Seret untuk memindahkan widget" style="font-size:15px; line-height:1; letter-spacing:-3px; cursor:grab;">⋮⋮</span>
        <span style="color:#fff; font-weight:bold; font-size:14px;">🎵 Lyrics</span>
        <span id="yt-lyrics-version" style="color:#777; font-size:10px;"></span>
      </div>
      <div style="display:flex; gap:4px;">
        <div id="yt-lyrics-actions"></div>
        <button id="yt-lyrics-mgmt-toggle" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:16px; padding:4px 7px;" title="Manajemen">⚙️</button>
        <button id="yt-lyrics-close" style="background:none; border:none; color:#ff4d4d; font-weight:bold; cursor:pointer; font-size:16px; padding:4px;">&times;</button>
      </div>
    </div>
    <div id="yt-lyrics-content-wrapper" style="position:relative; flex:1; min-height:0; background:#181818;">
      <div id="yt-lyrics-ai-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>
      <div style="padding:15px; height:100%; overflow:auto; color:#ddd; font-size:14px; line-height:1.6; text-align:center; scroll-behavior:smooth;" id="yt-lyrics-content">
        <div id="yt-lyrics-title" style="color:#aaa; font-weight:bold; margin-bottom:15px; font-size:12px;"></div>
        <div id="yt-lyrics-body"></div>
      </div>
    </div>
  </div>
  <style>
    /* CSS Warna Lirik Spesifik */
    .yt-lyric-btn { background:#2a2a2a; border:1px solid #444; color:#ddd; font-size:12px; padding:3px 8px; border-radius:4px; cursor:pointer; }
    .yt-lyric-btn:hover { background:#383838; color:#fff; }
    .yt-lyric-btn-danger { color:#ff6b6b; border-color:#662222; }
    .yt-lyric-btn-primary { color:#81c995; border-color:#2a5033; }
    .yt-lyric-btn-icon { width:34px; height:28px; padding:4px; display:inline-flex; align-items:center; justify-content:center; }
    .yt-lyric-btn-icon svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
    #yt-lyrics-actions { display:flex; flex-direction:row; align-items:center; gap:5px; max-width:530px; white-space:nowrap; }
    .yt-lyrics-action-row { display:contents; }
    .yt-lyrics-toggle { display:inline-flex; align-items:center; gap:6px; padding:3px 7px; border-color:#4a4a4a; color:#aaa; }
    .yt-lyrics-toggle-track { position:relative; display:inline-block; flex:0 0 26px; box-sizing:border-box; width:26px; height:14px; padding:0; border-radius:8px; background:#555; transition:background .15s; }
    .yt-lyrics-toggle-track::after { content:""; position:absolute; left:2px; top:50%; width:10px; height:10px; border-radius:50%; background:#ddd; transform:translateY(-50%); transition:transform .15s; }
    .yt-lyrics-toggle[aria-pressed="true"] { color:#d9f6e0; border-color:#50845d; }
    .yt-lyrics-toggle[aria-pressed="true"] .yt-lyrics-toggle-track { background:#438653; }
    .yt-lyrics-toggle[aria-pressed="true"] .yt-lyrics-toggle-track::after { transform:translate(12px, -50%); background:#fff; }
    .yt-lyrics-sync-group { display:flex; align-items:center; gap:0; }
    .yt-lyrics-sync-group .yt-lyric-btn { border-radius:0; }
    .yt-lyrics-sync-group .yt-lyric-btn:first-child { border-radius:4px 0 0 4px; }
    .yt-lyrics-sync-group .yt-lyric-btn:last-child { border-radius:0 4px 4px 0; }
    #yt-lyrics-offset { min-width:72px; color:#81c995; font-variant-numeric:tabular-nums; }
    #yt-lyrics-offset:disabled { opacity:1; cursor:pointer; }
    #yt-lyrics-ai-status { position:absolute; top:6px; left:50%; z-index:2; transform:translateX(-50%); max-width:calc(100% - 24px); padding:4px 9px; border:1px solid #665522; border-radius:999px; background:rgba(44,38,20,.94); color:#fbbc04; font-size:11px; line-height:1.3; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.3); }
    #yt-lyrics-ai-status:not([hidden])::before { content:""; display:inline-block; width:9px; height:9px; margin-right:6px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; vertical-align:-2px; animation:spin .8s linear infinite; }
    #yt-lyrics-ai-status.done { border-color:#2a5033; background:rgba(25,48,31,.94); color:#81c995; }
    #yt-lyrics-ai-status.done::before { content:"✓"; display:inline; border:0; animation:none; }
    #yt-lyrics-ai-status.failed { border-color:#662222; background:rgba(55,25,25,.94); color:#ff8a8a; }
    #yt-lyrics-ai-status.failed::before { content:"!"; display:inline; border:0; animation:none; }
    @keyframes spin { to { transform:rotate(360deg); } }
    #yt-lyrics-content { mask-image:linear-gradient(to bottom, transparent, #000 var(--lyric-fade, 12%), #000 calc(100% - var(--lyric-fade, 12%) - 4%), transparent); -webkit-mask-image:linear-gradient(to bottom, transparent, #000 var(--lyric-fade, 12%), #000 calc(100% - var(--lyric-fade, 12%) - 4%), transparent); }
    #yt-lyrics-source { margin:8px 0; display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
    #yt-lyrics-source input { width:240px; background:#242424; border:1px solid #555; border-radius:4px; color:#fff; padding:5px 7px; font-size:12px; }
    #yt-lyrics-help { color:#999; font-size:10px; text-align:left; max-width:520px; margin:4px auto 8px; }
    #yt-lyrics-body .lyric-sync-line { color: #888; margin: 10px 0; font-size: 16px; transition: color 0.2s, font-size 0.2s; }
    #yt-lyrics-body .lyric-sync-line.verse-start { margin-top: var(--lyric-spacing, 20px); }
    #yt-lyrics-body .lyric-sync-line.active { color: #ffffff; font-weight: bold; font-size: 20px; }
    #yt-lyrics-body .lyric-ori { color: #ffffff; font-weight: bold; display: block; }
    #yt-lyrics-body .lyric-romaji { color: #8ab4f8; font-style: italic; display: block; }
    #yt-lyrics-body .lyric-id { color: #81c995; display: block; margin-bottom: 15px; }
    #yt-lyrics-body .lyric-translation { color: #81c995; display: block; font-size: 13px; font-style: italic; line-height: 1.4; margin-top: 2px; }
    #yt-lyrics-body .lyric-sync-line.active .lyric-translation { font-size: 14px; }
    #yt-lyrics-body.hide-translation .lyric-translation,
    #yt-lyrics-body.hide-translation .lyric-id { display: none !important; }
    #yt-lyrics-body.hide-romaji .lyric-romaji { display: none !important; }
    #yt-lyrics-body .loading { color: #fbbc04; font-style: italic; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% {opacity:0.5;} 50% {opacity:1;} 100% {opacity:0.5;} }
    
    /* Scrollbar minimalis */
    #yt-lyrics-content::-webkit-scrollbar { width: 6px; }
    #yt-lyrics-content::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
    .mgmt-item { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid #333; font-size:12px; }
    .mgmt-item:last-child { border-bottom:none; }
    .mgmt-item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 450px; color: #bbb; }
  </style>
`;

// Suntikkan ke dalam halaman web. Markup statis internal (bukan data eksternal)
// di-parse via DOMParser sehingga tidak dieksekusi sebagai script.
const widgetDoc = new DOMParser().parseFromString(widgetHTML, 'text/html');
Array.from(widgetDoc.body.childNodes).forEach((node) => {
  document.body.appendChild(document.importNode(node, true));
});

const widget = document.getElementById('yt-lyrics-widget');
document.getElementById('yt-lyrics-version').textContent = `v${chrome.runtime.getManifest().version}`;
const header = document.getElementById('yt-lyrics-header');
const dragHandle = document.getElementById('yt-lyrics-drag-handle');
const closeBtn = document.getElementById('yt-lyrics-close');
const mgmtToggleBtn = document.getElementById('yt-lyrics-mgmt-toggle');
const actionsEl = document.getElementById('yt-lyrics-actions');
const titleEl = document.getElementById('yt-lyrics-title');
const bodyEl = document.getElementById('yt-lyrics-body');
const contentEl = document.getElementById('yt-lyrics-content');
const aiStatusEl = document.getElementById('yt-lyrics-ai-status');
let aiStatusTimer = null;

function setAiStatus(message, state = 'running', timeout = 0) {
  clearTimeout(aiStatusTimer);
  aiStatusEl.textContent = message;
  aiStatusEl.className = state;
  aiStatusEl.hidden = !message;
  if (message && timeout > 0) {
    aiStatusTimer = setTimeout(() => {
      aiStatusEl.hidden = true;
      aiStatusEl.textContent = '';
      aiStatusEl.className = '';
    }, timeout);
  }
}
const ALLOWED_LYRIC_TAGS = new Set(['SPAN', 'DIV', 'BR', 'P', 'B', 'I', 'EM', 'STRONG', 'A']);

function sanitizeLyricsHTML(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const clean = (node) => {
    Array.from(node.children).forEach((child) => {
      if (!ALLOWED_LYRIC_TAGS.has(child.tagName)) {
        child.replaceWith(doc.createTextNode(child.textContent || ''));
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        if (!['class', 'href', 'target', 'rel'].includes(attr.name)) child.removeAttribute(attr.name);
      });
      if (child.tagName === 'A') {
        const href = child.getAttribute('href');
        if (!href || !/^https?:\/\//i.test(href)) {
          child.removeAttribute('href');
        } else {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noreferrer noopener');
        }
      }
      clean(child);
    });
  };
  clean(doc.body);
  const fragment = document.createDocumentFragment();
  Array.from(doc.body.childNodes).forEach((node) => fragment.appendChild(document.importNode(node, true)));
  return fragment;
}

function showLoadingMessage(text) {
  bodyEl.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.textContent = text;
  bodyEl.appendChild(loading);
}

function showPlainMessage(text) {
  bodyEl.replaceChildren();
  bodyEl.textContent = text;
}

function createSvgIcon(dPaths) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  dPaths.forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  });
  return svg;
}

const contentWrapperEl = document.getElementById('yt-lyrics-content-wrapper');
const sourceEl = document.createElement('div');
sourceEl.id = 'yt-lyrics-source';
const lyricsUrlInput = document.createElement('input');
lyricsUrlInput.id = 'yt-lyrics-url';
lyricsUrlInput.type = 'url';
lyricsUrlInput.placeholder = 'https://lrclib.net/tracks/34709678';
const lyricsUrlLoad = document.createElement('button');
lyricsUrlLoad.id = 'yt-lyrics-url-load';
lyricsUrlLoad.className = 'yt-lyric-btn yt-lyric-btn-primary';
lyricsUrlLoad.textContent = 'Muat URL';
const lyricsHelpEl = document.createElement('div');
lyricsHelpEl.id = 'yt-lyrics-help';
lyricsHelpEl.append('Lirik sinkron disediakan oleh ');
const lyricsHelpLink = document.createElement('a');
lyricsHelpLink.href = 'https://lrclib.net/';
lyricsHelpLink.target = '_blank';
lyricsHelpLink.rel = 'noreferrer';
lyricsHelpLink.textContent = 'LRCLIB';
lyricsHelpEl.append(lyricsHelpLink, '. Untuk memuat track tertentu: buka halaman lirik LRCLIB, salin URL-nya, tempel di sini, lalu klik Muat URL.');
sourceEl.append(lyricsUrlInput, lyricsUrlLoad, lyricsHelpEl);
document.getElementById('yt-lyrics-content').insertBefore(sourceEl, bodyEl);
const customThemeStyle = document.createElement('style');
customThemeStyle.id = 'yt-lyrics-theme-style';
(document.head || document.documentElement).appendChild(customThemeStyle);

const DEFAULT_UI_CONFIG = {
  backgroundColor: '#181818',
  backgroundOpacity: 95,
  backdropBlur: 2,
  lyricFadePercent: 12,
  verseSpacing: 24,
  activeColor: '#ffffff',
  inactiveColor: '#a6a6a6',
  romajiColor: '#a9c7ff',
  translationColor: '#a6dfb5',
  showOriginal: true,
  showRomaji: true,
  originalColor: '#ffffff',
  activeFontSize: 24,
  inactiveFontSize: 16,
  originalFontSize: 18,
  romajiFontSize: 18,
  translationFontSize: 14,
  activeFontStyle: 'bold',
  inactiveFontStyle: 'normal',
  originalFontStyle: 'bold',
  romajiFontStyle: 'italic',
  translationFontStyle: 'italic'
};

function hexToRgba(hex, alphaPercent) {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const alpha = Math.max(0, Math.min(1, alphaPercent / 100));
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

// Cegah CSS injection lewat nilai config yang tidak tervalidasi.
function safeCssColor(value, fallback) {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function safeCssNumber(value, fallback, min, max) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : fallback;
}

function applyUiTheme(config = {}) {
  const theme = {
    ...DEFAULT_UI_CONFIG,
    ...config,
    backgroundColor: safeCssColor(config.backgroundColor, DEFAULT_UI_CONFIG.backgroundColor),
    activeColor: safeCssColor(config.activeColor, DEFAULT_UI_CONFIG.activeColor),
    inactiveColor: safeCssColor(config.inactiveColor, DEFAULT_UI_CONFIG.inactiveColor),
    romajiColor: safeCssColor(config.romajiColor, DEFAULT_UI_CONFIG.romajiColor),
    translationColor: safeCssColor(config.translationColor, DEFAULT_UI_CONFIG.translationColor),
    originalColor: safeCssColor(config.originalColor, DEFAULT_UI_CONFIG.originalColor),
    activeFontSize: safeCssNumber(config.activeFontSize, DEFAULT_UI_CONFIG.activeFontSize, 8, 72),
    inactiveFontSize: safeCssNumber(config.inactiveFontSize, DEFAULT_UI_CONFIG.inactiveFontSize, 8, 72),
    originalFontSize: safeCssNumber(config.originalFontSize, DEFAULT_UI_CONFIG.originalFontSize, 8, 72),
    romajiFontSize: safeCssNumber(config.romajiFontSize, DEFAULT_UI_CONFIG.romajiFontSize, 8, 72),
    translationFontSize: safeCssNumber(config.translationFontSize, DEFAULT_UI_CONFIG.translationFontSize, 8, 72),
    backgroundOpacity: safeCssNumber(config.backgroundOpacity, DEFAULT_UI_CONFIG.backgroundOpacity, 0, 100),
    backdropBlur: safeCssNumber(config.backdropBlur, DEFAULT_UI_CONFIG.backdropBlur, 0, 20),
    lyricFadePercent: safeCssNumber(config.lyricFadePercent, DEFAULT_UI_CONFIG.lyricFadePercent, 0, 30),
    verseSpacing: safeCssNumber(config.verseSpacing, DEFAULT_UI_CONFIG.verseSpacing, 0, 48)
  };
  const bgRgba = hexToRgba(theme.backgroundColor, theme.backgroundOpacity);
  const headerRgba = hexToRgba(theme.backgroundColor, Math.min(100, theme.backgroundOpacity + 5));

  widget.style.background = bgRgba;
  const backdropBlur = Math.min(20, Math.max(0, Number(theme.backdropBlur) || 0));
  widget.style.backdropFilter = backdropBlur ? `blur(${backdropBlur}px)` : 'none';
  const legacyLyricFade = Number(config.lyricFade);
  const lyricFade = Number.isFinite(Number(config.lyricFadePercent))
    ? Math.min(30, Math.max(0, Number(config.lyricFadePercent)))
    : Number.isFinite(legacyLyricFade) ? Math.min(30, Math.max(0, legacyLyricFade / 3)) : theme.lyricFadePercent;
  const verseSpacing = Math.min(48, Math.max(0, Number(theme.verseSpacing) || 0));
  contentWrapperEl.style.background = bgRgba;
  contentWrapperEl.style.backdropFilter = backdropBlur ? `blur(${backdropBlur}px)` : 'none';
  contentEl.style.setProperty('--lyric-fade', `${lyricFade}%`);
  const useLyricFade = lyricFade > 0;
  contentEl.style.maskImage = useLyricFade ? '' : 'none';
  contentEl.style.webkitMaskImage = useLyricFade ? '' : 'none';
  bodyEl.style.setProperty('--lyric-spacing', `${verseSpacing}px`);
  header.style.background = headerRgba;

  customThemeStyle.textContent = `
    #yt-lyrics-body .lyric-sync-line {
      color: ${theme.inactiveColor} !important;
      font-size: ${theme.inactiveFontSize}px !important;
      font-style: ${theme.inactiveFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.inactiveFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
    }
    #yt-lyrics-body .lyric-sync-line:not(.active) .lyric-romaji {
      color: ${theme.inactiveColor} !important;
      font-size: ${theme.inactiveFontSize}px !important;
      font-style: ${theme.inactiveFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.inactiveFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
    }
    #yt-lyrics-body .lyric-sync-line.active {
      color: ${theme.activeColor} !important;
      font-size: ${theme.activeFontSize}px !important;
      font-style: ${theme.activeFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.activeFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
      text-shadow: 0 1px 6px rgba(0,0,0,0.45);
    }
    #yt-lyrics-body .lyric-sync-line.active .lyric-romaji {
      color: ${theme.activeColor} !important;
      font-size: ${theme.activeFontSize}px !important;
      font-style: ${theme.activeFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.activeFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
      text-shadow: 0 1px 6px rgba(0,0,0,0.45);
    }
    #yt-lyrics-body.hide-romaji .lyric-sync-line.active .lyric-original {
      color: ${theme.activeColor} !important;
      font-size: ${theme.activeFontSize}px !important;
      font-style: ${theme.activeFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.activeFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
      text-shadow: 0 1px 6px rgba(0,0,0,0.45);
    }
    #yt-lyrics-body .lyric-ori {
      color: ${theme.originalColor} !important;
      font-size: ${theme.originalFontSize}px !important;
      font-style: ${theme.originalFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.originalFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
    }
    #yt-lyrics-body .lyric-original {
      color: ${theme.originalColor} !important;
      font-size: ${theme.originalFontSize}px !important;
      font-style: ${theme.originalFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.originalFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
      display: block;
    }
    #yt-lyrics-body .lyric-romaji {
      color: ${theme.romajiColor} !important;
      font-size: ${theme.romajiFontSize}px !important;
      font-style: ${theme.romajiFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.romajiFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
    }
    #yt-lyrics-body .lyric-id {
      color: ${theme.translationColor} !important;
    }
    #yt-lyrics-body .lyric-translation {
      color: ${theme.translationColor} !important;
      font-size: ${theme.translationFontSize}px !important;
      font-style: ${theme.translationFontStyle.includes('italic') ? 'italic' : 'normal'} !important;
      font-weight: ${theme.translationFontStyle.includes('bold') ? 'bold' : 'normal'} !important;
    }
  `;
}

chrome.storage.local.get('uiConfig', ({ uiConfig }) => {
  showOriginalLyrics = uiConfig?.showOriginal !== false;
  defaultShowRomaji = uiConfig?.showRomaji !== false;
  applyUiTheme(uiConfig);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.uiConfig) {
    showOriginalLyrics = changes.uiConfig.newValue?.showOriginal !== false;
    defaultShowRomaji = changes.uiConfig.newValue?.showRomaji !== false;
    applyUiTheme(changes.uiConfig.newValue);
    if (currentLyricsPayload?.type === 'synced') renderCurrentPayload();
  }
  if (area === 'local' && changes.translateConfig) {
    applyTranslateSettings(changes.translateConfig.newValue);
  }
});

mgmtToggleBtn.onclick = () => {
  chrome.runtime.sendMessage({ action: "openManagementWindow" });
};

let parsedLyrics = [];
let activeLyricIndex = -1;
let currentSongInfo = null;
let currentLyricsPayload = null;
let isFromCache = false;
let isLoading = false;
let isStopped = false;
let currentLoadToken = 0;
let lastYouTubeVideoId = null;
let lastSourceVideoId = null;
let showOriginalLyrics = true;
let defaultShowRomaji = true;

// Pengaturan terjemahan (chrome.storage.local "translateConfig").
// Toggle hanya menampilkan/menyembunyikan terjemahan; proses AI tidak dipengaruhi toggle.
let showTranslation = true;
let translateLang = 'id';
let translateRequestInFlight = false;
let translationAttempts = new WeakMap();

function applyTranslateSettings(config = {}) {
  showTranslation = config.show !== false;
  translateLang = config.language || 'id';
  if (currentLyricsPayload?.type === 'synced') {
    renderCurrentPayload();
    ensureTranslation();
  }
}

function toggleCurrentLyricVisibility(key) {
  if (!currentLyricsPayload?.type || !(key in currentLyricsPayload)) return;
  currentLyricsPayload[key] = !currentLyricsPayload[key];
  renderCurrentPayload();
  persistCurrentLyrics();
}

chrome.storage.local.get('translateConfig', ({ translateConfig }) => {
  applyTranslateSettings(translateConfig);
});

function roundOffset(value) {
  return Math.round(value * 10) / 10;
}

function updateActionButtons() {
  actionsEl.replaceChildren();
  const primaryRow = document.createElement('div');
  primaryRow.className = 'yt-lyrics-action-row';
  const syncRow = document.createElement('div');
  syncRow.className = 'yt-lyrics-action-row';
  const button = (text, className, title, handler) => {
    const element = document.createElement('button');
    element.className = `yt-lyric-btn ${className}`;
    if (text === 'Refresh' || text === 'Hapus') {
      element.classList.add('yt-lyric-btn-icon');
      element.appendChild(text === 'Refresh'
        ? createSvgIcon(['M20 7v5h-5M4 17v-5h5', 'M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3'])
        : createSvgIcon(['M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6']));
      element.setAttribute('aria-label', title);
    } else {
      element.textContent = text;
    }
    element.title = title;
    element.onclick = handler;
    return element;
  };
  const toggleButton = (text, key) => {
    const enabled = Boolean(currentLyricsPayload[key]);
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'yt-lyric-btn yt-lyrics-toggle';
    element.setAttribute('aria-pressed', String(enabled));
    element.title = `${enabled ? 'Sembunyikan' : 'Tampilkan'} ${text.toLowerCase()}`;
    const label = document.createElement('span');
    label.textContent = text;
    const track = document.createElement('span');
    track.className = 'yt-lyrics-toggle-track';
    track.setAttribute('aria-hidden', 'true');
    element.append(label, track);
    element.onclick = () => toggleCurrentLyricVisibility(key);
    return element;
  };

  const refreshBtn = currentSongInfo?.videoId && !isLoading
    ? button('Refresh', '', 'Ambil ulang lirik', () => {
      chrome.runtime.sendMessage({ action: 'getActiveVideoInfo' }, (activeInfo) => {
        if (chrome.runtime.lastError || !activeInfo?.songTitle) {
          bodyEl.textContent = 'Tidak ada video YouTube aktif.';
          return;
        }
        loadLyrics(activeInfo);
      });
    })
    : null;

  if (isLoading && !isStopped) {
    primaryRow.appendChild(button('Stop', 'yt-lyric-btn-danger', 'Hentikan proses otomatis', () => {
      isStopped = true;
      currentLoadToken += 1;
      isLoading = false;
      bodyEl.textContent = 'Proses dihentikan manual.';
      updateActionButtons();
    }));
  }

  if (currentSongInfo?.videoId && currentLyricsPayload && !isLoading) {
    if (currentLyricsPayload.type === 'synced') {
      primaryRow.appendChild(toggleButton('Terj', 'showTranslation'));
      primaryRow.appendChild(toggleButton('Asli', 'showOriginal'));
      primaryRow.appendChild(toggleButton('Roma', 'showRomaji'));
    }

    if (isFromCache) {
      if (refreshBtn) primaryRow.appendChild(refreshBtn);
      primaryRow.appendChild(button('Hapus', 'yt-lyric-btn-danger', 'Hapus lirik tersimpan', () => {
        deleteLyrics(currentSongInfo.videoId);
      }));
    } else {
      primaryRow.appendChild(button('Simpan', 'yt-lyric-btn-primary', 'Simpan lirik ke local storage', () => {
        const payload = withCurrentVideoMetadata(currentLyricsPayload);
        chrome.storage.local.set({ [currentSongInfo.videoId]: withSongMetadata(payload, currentSongInfo) }, () => {
          currentLyricsPayload = payload;
          isFromCache = true;
          updateActionButtons();
        });
      }));
    }

    if (currentLyricsPayload.type === 'synced') {
      const syncGroup = document.createElement('div');
      syncGroup.className = 'yt-lyrics-sync-group';
      syncGroup.appendChild(button('-0.1s', '', 'Lirik muncul 0.1 detik lebih lambat', () => updateTimestampOffset(0.1)));
      syncGroup.appendChild(button(`${(currentLyricsPayload.offset || 0) >= 0 ? '+' : ''}${(currentLyricsPayload.offset || 0).toFixed(1)}s`, '', 'Klik untuk reset sinkronisasi', resetTimestamp));
      syncGroup.appendChild(button('+0.1s', '', 'Lirik muncul 0.1 detik lebih cepat', () => updateTimestampOffset(-0.1)));
      syncRow.appendChild(syncGroup);
    }
  }
  if (refreshBtn && !primaryRow.contains(refreshBtn)) primaryRow.appendChild(refreshBtn);
  if (syncRow.childElementCount) actionsEl.appendChild(syncRow);
  if (primaryRow.childElementCount) actionsEl.appendChild(primaryRow);
}

function updateOffsetInfo() {
  const offset = currentLyricsPayload?.type === 'synced' ? currentLyricsPayload.offset || 0 : 0;
  const indicator = actionsEl.querySelector('.yt-lyrics-sync-group button:nth-child(2)');
  if (indicator) indicator.textContent = `${offset >= 0 ? '+' : ''}${offset.toFixed(1)}s`;
}

function persistCurrentLyrics() {
  if (!isFromCache || !currentSongInfo?.videoId || !currentLyricsPayload) return;
  chrome.storage.local.set({ [currentSongInfo.videoId]: withSongMetadata(currentLyricsPayload, currentSongInfo) });
}

function withSongMetadata(payload, info) {
  const rawTitle = info.rawTitle || info.songTitle || '';
  return {
    ...payload,
    artistName: info.artist || '',
    trackName: rawTitle,
    songTitle: info.songTitle || rawTitle
  };
}

function withCurrentVideoMetadata(payload) {
  const videoId = getYouTubeVideoId();
  if (!videoId) return payload;
  const duration = getActiveVideo()?.duration;
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const existing = videos.find((video) => video.videoId === videoId);
  const video = {
    videoId,
    duration: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : existing?.duration ?? null
  };
  return {
    ...payload,
    videos: [...videos.filter((item) => item.videoId !== videoId), video]
  };
}

function normalizeTranslationsMap(translations, fallbackLang) {
  if (!translations) return {};
  if (Array.isArray(translations)) {
    return fallbackLang && translations.every((line) => typeof line === 'string')
      ? { [fallbackLang]: translations }
      : {};
  }
  if (typeof translations === 'object') {
    const result = {};
    Object.entries(translations).forEach(([lang, lines]) => {
      if (typeof lang === 'string' && Array.isArray(lines) && lines.every((line) => typeof line === 'string')) {
        result[lang] = lines;
      }
    });
    return result;
  }
  return {};
}

// Terjemahan selalu diproses AI ke bahasa pilihan (apa pun status toggle) dan
// disimpan ke storage; toggle hanya memengaruhi tampilan.
function ensureTranslation() {
  const payload = currentLyricsPayload;
  if (!payload || payload.type !== 'synced' || !payload.data) return;
  const currentTranslations = normalizeTranslationsMap(payload.translations, payload.translateLang);
  if (currentTranslations[translateLang]) {
    payload.translations = currentTranslations;
    payload.translateLang = translateLang;
    renderCurrentPayload();
    return; // bahasa ini sudah ada di cache lokal lagu
  }
  const attemptedLanguages = translationAttempts.get(payload) || new Set();
  if (attemptedLanguages.has(translateLang) || translateRequestInFlight) return;
  attemptedLanguages.add(translateLang);
  translationAttempts.set(payload, attemptedLanguages);

  translateRequestInFlight = true;
  const targetPayload = payload;
  const sourceLyrics = payload.originalData || payload.data;
  setAiStatus(`Menerjemahkan lirik ke ${translateLang}...`);
  chrome.runtime.sendMessage({ action: 'translateLyrics', lyrics: sourceLyrics, info: currentSongInfo }, (response) => {
    translateRequestInFlight = false;
    if (chrome.runtime.lastError || currentLyricsPayload !== targetPayload) {
      setAiStatus('Proses AI gagal. Lirik asli tetap ditampilkan.', 'failed', 3500);
      return;
    }
    const resLang = response?.translateLang || translateLang;
    const resLines = Array.isArray(response?.translations) && response.translations.every((line) => typeof line === 'string')
      ? response.translations : null;
    const mergedTranslations = normalizeTranslationsMap(targetPayload.translations, targetPayload.translateLang);
    if (resLines) {
      mergedTranslations[resLang] = resLines;
    }
    targetPayload.translations = mergedTranslations;
    targetPayload.translateLang = resLang;
    if (isFromCache && resLines) persistCurrentLyrics();
    if (resLines) {
      setAiStatus(`Terjemahan ${resLang} selesai.`, 'done', 2200);
    } else {
      setAiStatus('AI tidak menghasilkan terjemahan. Lirik asli tetap ditampilkan.', 'failed', 3500);
    }
    renderCurrentPayload();
    ensureTranslation(); // lanjut bila bahasa pilihan berubah saat request berjalan
  });
}

function renderCurrentPayload() {
  const lines = parseLRC(currentLyricsPayload.data).map((line) => ({
    ...line,
    time: Math.max(0, line.time + (currentLyricsPayload.offset || 0))
  }));
  renderSyncedLyrics(lines);
  updateOffsetInfo();
  updateActionButtons();
}

function updateTimestampOffset(delta) {
  if (!currentLyricsPayload || currentLyricsPayload.type !== 'synced') return;
  currentLyricsPayload.offset = roundOffset((currentLyricsPayload.offset || 0) + delta);
  renderCurrentPayload();
  persistCurrentLyrics();
}

function resetTimestamp() {
  if (!currentLyricsPayload || currentLyricsPayload.type !== 'synced') return;
  currentLyricsPayload.offset = 0;
  renderCurrentPayload();
  persistCurrentLyrics();
}

function deleteLyrics(key) {
  chrome.storage.local.remove(key, () => {
    if (chrome.runtime.lastError) return;
    isFromCache = false;
    updateActionButtons();
  });
}

function parseLRC(lrcText) {
  const lines = lrcText.split(/\r?\n/);
  const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;
  let rawIndex = 0;
  const parsed = [];
  lines.forEach((line) => {
    const match = regex.exec(line);
    if (!match) return;
    // Urutan baris bertimestamp — sejajar dengan array `translations` dari background.js
    const trIndex = rawIndex;
    rawIndex += 1;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, '0'), 10);
    const text = match[4].trim();
    if (text) parsed.push({ time: min * 60 + sec + ms / 1000, text, trIndex });
  });
  return parsed;
}

function getPayloadTranslations() {
  const payload = currentLyricsPayload;
  if (!payload) return null;
  const translationsMap = normalizeTranslationsMap(payload.translations, payload.translateLang);
  const targetLines = translationsMap[translateLang];
  if (Array.isArray(targetLines)) return targetLines;
  if (Array.isArray(payload.translations) && (!payload.translateLang || payload.translateLang === translateLang)) {
    return payload.translations;
  }
  return null;
}

function renderSyncedLyrics(lines) {
  parsedLyrics = lines
    .filter((line) => Number.isFinite(line.time) && line.text)
    .sort((a, b) => a.time - b.time);
  const translations = getPayloadTranslations();
  const originalLines = currentLyricsPayload?.originalData
    ? parseLRC(currentLyricsPayload.originalData)
    : [];
  activeLyricIndex = -1;
  bodyEl.replaceChildren();
  const isRomajiVisible = currentLyricsPayload?.showRomaji !== false;
  bodyEl.classList.toggle('hide-romaji', !isRomajiVisible);
  parsedLyrics.forEach((line, index) => {
    const p = document.createElement('p');
    p.id = `lyric-line-${index}`;
    p.className = 'lyric-sync-line';
    if (index > 0 && line.time - parsedLyrics[index - 1].time >= 4.5) p.classList.add('verse-start');
    const originalText = originalLines.find((original) => original.trIndex === line.trIndex)?.text;
    if (originalText && (currentLyricsPayload.showOriginal || !isRomajiVisible)) {
      const span = document.createElement('span');
      span.className = 'lyric-original';
      span.textContent = originalText;
      p.appendChild(span);
    }
    if (isRomajiVisible) {
      const romaji = document.createElement('span');
      romaji.className = 'lyric-romaji';
      romaji.textContent = line.text;
      p.appendChild(romaji);
    }
    if (currentLyricsPayload.showTranslation && translations && typeof translations[line.trIndex] === 'string') {
      const span = document.createElement('span');
      span.className = 'lyric-translation';
      span.textContent = translations[line.trIndex];
      p.appendChild(span);
    }
    bodyEl.appendChild(p);
  });
  updateActiveLyric(document.querySelector('video')?.currentTime ?? 0);
}

function displayLyrics(payload, fromCache) {
  if (typeof payload === 'string') {
    payload = { type: 'plain', data: payload };
  }
  if (payload.type === 'synced') {
    const translationsMap = normalizeTranslationsMap(payload.translations, payload.translateLang);
    payload = {
      type: 'synced',
      data: payload.data,
      originalData: payload.originalData || payload.data,
      offset: roundOffset(Number(payload.offset) || 0),
      translations: Object.keys(translationsMap).length > 0 ? translationsMap : (Array.isArray(payload.translations) ? payload.translations : null),
      translateLang: payload.translateLang || null,
      showOriginal: typeof payload.showOriginal === 'boolean' ? payload.showOriginal : showOriginalLyrics,
      showTranslation: typeof payload.showTranslation === 'boolean' ? payload.showTranslation : showTranslation,
      showRomaji: typeof payload.showRomaji === 'boolean' ? payload.showRomaji : defaultShowRomaji,
      lrclibId: Number.isInteger(payload.lrclibId) ? payload.lrclibId : null,
      videos: Array.isArray(payload.videos) ? payload.videos : [],
      lrclibUrl: typeof payload.lrclibUrl === 'string' && payload.lrclibUrl
        ? payload.lrclibUrl
        : Number.isInteger(payload.lrclibId) ? `https://lrclib.net/tracks/${payload.lrclibId}` : ''
    };
  }
  currentLyricsPayload = payload;
  isFromCache = fromCache;
  lyricsUrlInput.value = payload.type === 'synced' ? payload.lrclibUrl || '' : '';
  updateOffsetInfo();
  updateActionButtons();

  if (payload.type === 'synced') {
    const lines = parseLRC(payload.data);
    if (lines.length) {
      renderCurrentPayload();
      // Proses translasi AI mengikuti bahasa pilihan, apa pun status toggle tampilan
      ensureTranslation();
      return;
    }
  }
  parsedLyrics = [];
  activeLyricIndex = -1;
  bodyEl.replaceChildren();
  const plainContent = payload.data || 'Lirik tidak ditemukan.';
  if (/<[a-z][\s\S]*>/i.test(plainContent)) {
    bodyEl.appendChild(sanitizeLyricsHTML(plainContent));
  } else {
    const plainEl = document.createElement('div');
    plainEl.style.whiteSpace = 'pre-wrap';
    plainEl.textContent = plainContent;
    bodyEl.appendChild(plainEl);
  }
}

function loadLyrics(info, forceFetch = false) {
  if (!info?.videoId || !/^[\w-]{11}$/.test(info.videoId)) {
    titleEl.textContent = 'Gagal mendapatkan ID video';
    bodyEl.textContent = 'ID video YouTube tidak valid.';
    return;
  }
  const loadToken = ++currentLoadToken;
  const isCurrentLoad = () => !isStopped && loadToken === currentLoadToken;
    currentSongInfo = info;
    currentLyricsPayload = null;
    isFromCache = false;
  isStopped = false;
    parsedLyrics = [];
    activeLyricIndex = -1;
    titleEl.textContent = `Lagu: ${info.fullName || `${info.artist} - ${info.songTitle}`}`;
    lyricsUrlInput.value = '';
    isLoading = true;
    updateActionButtons();

    const fetchLyrics = () => {
      if (!isCurrentLoad()) return;
        showLoadingMessage('Mencari lirik sinkron di LRCLIB...');
        chrome.runtime.sendMessage({ action: 'fetchSyncedLyrics', info }, (response) => {
        if (!isCurrentLoad()) return;
            if (chrome.runtime.lastError) {
              isLoading = false;
              updateActionButtons();
              showPlainMessage('Gagal menghubungi layanan lirik.');
                return;
            }
            if (response?.success && response.lyrics && parseLRC(response.lyrics).length) {
              const resLang = response.translateLang || null;
              const resTranslations = response.translations && resLang
                ? { [resLang]: response.translations }
                : (response.translations || null);
              const payload = {
                type: 'synced',
                data: response.lyrics,
                originalData: response.originalLyrics || response.lyrics,
                offset: 0,
                translations: resTranslations,
                translateLang: resLang,
                lrclibId: response.lrclibId || null,
                lrclibUrl: response.lrclibUrl || ''
              };
              displayLyrics(payload, false);
              if (response.aiProcessed) {
                chrome.storage.local.set({ [info.videoId]: withSongMetadata(withCurrentVideoMetadata(payload), info) });
              }
                isLoading = false;
                updateActionButtons();
                return;
            }

              if (!isCurrentLoad()) return;
            showLoadingMessage('Lirik sinkron tidak ada. Mencari teks biasa...');
            chrome.runtime.sendMessage({ action: 'fetchLyrics', info }, (plainResponse) => {
                if (!isCurrentLoad()) return;
                if (chrome.runtime.lastError) {
                  isLoading = false;
                  updateActionButtons();
                    showPlainMessage('Gagal menghubungi layanan lirik.');
                    return;
                }
                displayLyrics({ type: 'plain', data: plainResponse || 'Lirik tidak ditemukan.' }, false);
                isLoading = false;
                updateActionButtons();
            });
        });
    };

    if (forceFetch) {
        fetchLyrics();
        return;
    }

    chrome.storage.local.get([info.videoId, info.fullName], (result) => {
    if (!isCurrentLoad()) return;
        const legacyPayload = result[info.videoId] ? null : result[info.fullName];
        const storedPayload = result[info.videoId] || legacyPayload;
        if (storedPayload) {
        isLoading = false;
            const cachedPayload = withSongMetadata(withCurrentVideoMetadata(storedPayload), info);
            const rawTrackName = info.rawTitle || info.songTitle || '';
            const needsMetadataUpdate = legacyPayload || storedPayload.trackName !== rawTrackName ||
              storedPayload.artistName !== (info.artist || '') || storedPayload.songTitle !== (info.songTitle || rawTrackName);
            if (needsMetadataUpdate) {
              chrome.storage.local.set({ [info.videoId]: cachedPayload }, () => {
                if (!chrome.runtime.lastError && legacyPayload) {
                  chrome.storage.local.remove(info.fullName);
                }
              });
            }
            displayLyrics(cachedPayload, true);
            return;
        }
        fetchLyrics();
    });
}

function loadLyricsByUrl(url) {
  if (!currentSongInfo || isLoading) return;
  const loadToken = ++currentLoadToken;
  const isCurrentLoad = () => !isStopped && loadToken === currentLoadToken;
  isStopped = false;
  isLoading = true;
  updateActionButtons();
  showLoadingMessage('Memuat lirik dari URL LRCLIB...');
  chrome.runtime.sendMessage({ action: 'fetchLyricsByLrclibUrl', url, info: currentSongInfo }, (response) => {
    if (!isCurrentLoad()) return;
    isLoading = false;
    if (chrome.runtime.lastError || !response?.success || !response.lyrics) {
      showPlainMessage(response?.error || 'Gagal memuat URL LRCLIB.');
      updateActionButtons();
      return;
    }
    const resLang = response.translateLang || null;
    const resTranslations = response.translations && resLang
      ? { [resLang]: response.translations }
      : (response.translations || null);
    const payload = { type: 'synced', data: response.lyrics, originalData: response.originalLyrics || response.lyrics, offset: 0, translations: resTranslations, translateLang: resLang, lrclibId: response.lrclibId || null, lrclibUrl: response.lrclibUrl || url };
    displayLyrics(payload, false);
    if (response.aiProcessed) {
      chrome.storage.local.set({ [currentSongInfo.videoId]: withSongMetadata(withCurrentVideoMetadata(payload), currentSongInfo) });
    }
  });
}

lyricsUrlLoad.onclick = () => loadLyricsByUrl(lyricsUrlInput.value.trim());

function getActiveVideo() {
  const videos = Array.from(document.querySelectorAll('video'));
  return videos.find((v) => !v.paused && v.currentTime > 0) || document.querySelector('video.html5-main-video') || videos[0] || null;
}

function updateActiveLyric(currentTime) {
  if (!parsedLyrics.length || widget.style.display === 'none') return;

  let targetIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) targetIndex = i;
    else break;
  }

  if (targetIndex === activeLyricIndex) return;
  if (activeLyricIndex !== -1) {
    document.getElementById(`lyric-line-${activeLyricIndex}`)?.classList.remove('active');
  }

  activeLyricIndex = targetIndex;
  if (targetIndex === -1) return;

  const current = document.getElementById(`lyric-line-${targetIndex}`);
  if (current) {
    current.classList.add('active');
    bodyEl.style.paddingBottom = `${Math.ceil(contentEl.clientHeight * 0.6)}px`;
    const contentRect = contentEl.getBoundingClientRect();
    const lineRect = current.getBoundingClientRect();
    contentEl.scrollTo({
      top: contentEl.scrollTop + lineRect.top - contentRect.top - (contentEl.clientHeight * 0.42 - current.offsetHeight / 2),
      behavior: 'smooth'
    });
  }
}

const isYTPage = location.hostname.includes('youtube.com');

function getYouTubeVideoId() {
  if (!isYTPage) return null;
  const videoId = new URLSearchParams(location.search).get('v');
  return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
}

function checkYouTubeVideoChange() {
  if (!isYTPage || widget.style.display === 'none') return;
  const currentId = getYouTubeVideoId();
  if (!currentId) return;

  if (!lastYouTubeVideoId) {
    lastYouTubeVideoId = currentId;
    return;
  }

  if (currentId !== lastYouTubeVideoId) {
    lastYouTubeVideoId = currentId;
    chrome.runtime.sendMessage({ action: 'getVideoInfo', videoId: currentId }, (response) => {
      if (!chrome.runtime.lastError && response?.success && response.info) loadLyrics(response.info);
      else {
        titleEl.textContent = 'Gagal mendapatkan info video';
        bodyEl.textContent = response?.error || 'Periksa konfigurasi sumber info video.';
      }
    });
  }
}

if (isYTPage) {
  window.addEventListener('yt-navigate-finish', checkYouTubeVideoChange);
}

if (isYTPage) {
  setInterval(() => {
    const video = getActiveVideo();
    if (!video || video.dataset.lyricBound) return;
    video.dataset.lyricBound = 'true';

    const sync = () => updateActiveLyric(video.currentTime);
    video.addEventListener('timeupdate', sync);
    video.addEventListener('seeking', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('loadedmetadata', sync);
    checkYouTubeVideoChange();
  }, 500);
}

setInterval(() => {
  if (!parsedLyrics.length || widget.style.display === 'none') return;
  if (isYTPage) return;

  chrome.runtime.sendMessage({ action: 'getVideoTime' }, (response) => {
    if (!chrome.runtime.lastError && typeof response?.time === 'number') {
      updateActiveLyric(response.time);
    }
  });

  chrome.runtime.sendMessage({ action: 'getActiveVideoInfo' }, (response) => {
    if (chrome.runtime.lastError || !response?.songTitle) return;
    const videoChanged = response.videoId && response.videoId !== lastSourceVideoId;

    if (!currentSongInfo || videoChanged || response.videoId !== currentSongInfo.videoId) {
      lastSourceVideoId = response.videoId || null;
      loadLyrics(response);
    }
  });
}, 300);

// 2. Fungsi Ekstrak Judul
function getYouTubeInfo() {
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string');
    const rawTitle = titleElement ? titleElement.textContent.trim() : document.title.trim();
    const channelElement = document.querySelector('ytd-video-owner-renderer yt-formatted-string a, ytd-channel-name yt-formatted-string a');
    return {
      videoId: getYouTubeVideoId(),
      rawTitle,
      channelTitle: channelElement ? channelElement.textContent.trim() : ''
    };
  }

  // 3. Logika Menarik/Menggeser Widget (Draggable)
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0, yOffset = 0;
  
  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    if (e.button !== 0) return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    dragHandle.style.cursor = 'grabbing';
  }
  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      widget.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
  }
  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    dragHandle.style.cursor = 'grab';
  }
  
  // 4. Logika Buka/Tutup & Load Data
  closeBtn.onclick = () => widget.style.display = 'none';
  
  // Mendengarkan perintah dari background.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'queryVideoTime') {
      const video = getActiveVideo();
      sendResponse({ time: video ? video.currentTime : null });
      return;
    }
    if (request.action === "getRawTitle") {
      sendResponse(getYouTubeInfo()); // Kirim seluruh objek info
    }
    
    if (request.action === "toggleWidget") {
      widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
      
      if (widget.style.display === 'flex') {
        const info = request.info; // Data sekarang berbentuk objek
        
        if (!info || !info.songTitle) {
          currentSongInfo = null;
          currentLyricsPayload = null;
          updateActionButtons();
          titleEl.textContent = "Error";
          bodyEl.textContent = "Tidak ada video YouTube yang sedang diputar.";
          return;
        }
        if (isYTPage) {
          lastYouTubeVideoId = getYouTubeVideoId();
        }
        loadLyrics(info);
      }
    }

    if (request.action === "updateStatus") {
      const loadingEl = document.querySelector('#yt-lyrics-body .loading');
      if (loadingEl) {
        loadingEl.textContent = request.status;
      } else if (request.status) {
        setAiStatus(request.status);
      }
    }
  });