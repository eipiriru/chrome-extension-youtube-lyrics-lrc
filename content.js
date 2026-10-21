// content.js

// 1. Buat elemen Widget UI
const widgetHTML = `
  <div id="yt-lyrics-widget" style="display:none; position:fixed; top:80px; right:20px; width:min(720px, calc(100vw - 32px)); background:#181818; border:1px solid #333; border-radius:10px; z-index:999999; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif; overflow:hidden;">
    <div id="yt-lyrics-header" style="background:#202020; padding:12px; cursor:grab; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border-bottom:1px solid #333;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:#fff; font-weight:bold; font-size:14px;">🎵 Lyrics</span>
        <div id="yt-lyrics-offset" style="color:#aaa; font-size:11px;" aria-live="polite"></div>
      </div>
      <div style="display:flex; gap:4px;">
        <div id="yt-lyrics-actions" style="display:flex; gap:5px; align-items:center; justify-content:flex-end; flex-wrap:wrap; max-width:530px;"></div>
        <button id="yt-lyrics-mgmt-toggle" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:16px; padding:4px;" title="Manajemen">⚙️</button>
        <button id="yt-lyrics-close" style="background:none; border:none; color:#ff4d4d; font-weight:bold; cursor:pointer; font-size:16px; padding:4px;">&times;</button>
      </div>
    </div>
    <div style="padding:15px; max-height:350px; overflow-y:auto; color:#ddd; font-size:14px; line-height:1.6; text-align:center; scroll-behavior:smooth;" id="yt-lyrics-content">
      <div id="yt-lyrics-title" style="color:#aaa; font-weight:bold; margin-bottom:15px; font-size:12px;"></div>
      <div id="yt-lyrics-body"></div>
    </div>
  </div>
  <style>
    /* CSS Warna Lirik Spesifik */
    .yt-lyric-btn { background:#2a2a2a; border:1px solid #444; color:#ddd; font-size:12px; padding:3px 8px; border-radius:4px; cursor:pointer; }
    .yt-lyric-btn:hover { background:#383838; color:#fff; }
    .yt-lyric-btn-danger { color:#ff6b6b; border-color:#662222; }
    .yt-lyric-btn-primary { color:#81c995; border-color:#2a5033; }
    #yt-lyrics-source { margin:8px 0; display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
    #yt-lyrics-source input { width:240px; background:#242424; border:1px solid #555; border-radius:4px; color:#fff; padding:5px 7px; font-size:12px; }
    #yt-lyrics-help { color:#999; font-size:10px; text-align:left; max-width:520px; margin:4px auto 8px; }
    #yt-lyrics-body .lyric-sync-line { color: #888; margin: 10px 0; font-size: 16px; transition: color 0.2s, font-size 0.2s; }
    #yt-lyrics-body .lyric-sync-line.active { color: #ffffff; font-weight: bold; font-size: 20px; }
    #yt-lyrics-body .lyric-ori { color: #ffffff; font-weight: bold; display: block; }
    #yt-lyrics-body .lyric-romaji { color: #8ab4f8; font-style: italic; display: block; }
    #yt-lyrics-body .lyric-id { color: #81c995; display: block; margin-bottom: 15px; }
    #yt-lyrics-body .lyric-translation { color: #81c995; display: block; font-size: 13px; font-style: italic; line-height: 1.4; margin-top: 2px; }
    #yt-lyrics-body .lyric-sync-line.active .lyric-translation { font-size: 14px; }
    #yt-lyrics-body.hide-translation .lyric-translation,
    #yt-lyrics-body.hide-translation .lyric-id { display: none !important; }
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

// Suntikkan ke dalam halaman web
document.body.insertAdjacentHTML('beforeend', widgetHTML);

const widget = document.getElementById('yt-lyrics-widget');
const header = document.getElementById('yt-lyrics-header');
const closeBtn = document.getElementById('yt-lyrics-close');
const mgmtToggleBtn = document.getElementById('yt-lyrics-mgmt-toggle');
const actionsEl = document.getElementById('yt-lyrics-actions');
const titleEl = document.getElementById('yt-lyrics-title');
const offsetEl = document.getElementById('yt-lyrics-offset');
const bodyEl = document.getElementById('yt-lyrics-body');
const sourceEl = document.createElement('div');
sourceEl.id = 'yt-lyrics-source';
sourceEl.innerHTML = `
  <input id="yt-lyrics-url" type="url" placeholder="https://lrclib.net/tracks/34709678">
  <button id="yt-lyrics-url-load" class="yt-lyric-btn yt-lyric-btn-primary">Muat URL</button>
  <div id="yt-lyrics-help">Lirik sinkron disediakan oleh <a href="https://lrclib.net/" target="_blank" rel="noreferrer">LRCLIB</a>. Untuk memuat track tertentu: buka halaman lirik LRCLIB, salin URL-nya, tempel di sini, lalu klik Muat URL.</div>
`;
document.getElementById('yt-lyrics-content').insertBefore(sourceEl, bodyEl);
const lyricsUrlInput = document.getElementById('yt-lyrics-url');
const lyricsUrlLoad = document.getElementById('yt-lyrics-url-load');
const customThemeStyle = document.createElement('style');
customThemeStyle.id = 'yt-lyrics-theme-style';
(document.head || document.documentElement).appendChild(customThemeStyle);

const DEFAULT_UI_CONFIG = {
  backgroundColor: '#181818',
  backgroundOpacity: 95,
  activeColor: '#ffffff',
  inactiveColor: '#888888',
  romajiColor: '#8ab4f8',
  translationColor: '#81c995',
  activeFontSize: 20
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

function applyUiTheme(config = {}) {
  const theme = { ...DEFAULT_UI_CONFIG, ...config };
  const bgRgba = hexToRgba(theme.backgroundColor, theme.backgroundOpacity);
  const headerRgba = hexToRgba(theme.backgroundColor, Math.min(100, theme.backgroundOpacity + 5));

  widget.style.background = bgRgba;
  widget.style.backdropFilter = theme.backgroundOpacity < 100 ? 'blur(8px)' : 'none';
  header.style.background = headerRgba;

  customThemeStyle.textContent = `
    #yt-lyrics-body .lyric-sync-line {
      color: ${theme.inactiveColor} !important;
    }
    #yt-lyrics-body .lyric-sync-line.active {
      color: ${theme.activeColor} !important;
      font-size: ${theme.activeFontSize}px !important;
      text-shadow: 0 1px 6px rgba(0,0,0,0.45);
    }
    #yt-lyrics-body .lyric-ori {
      color: ${theme.activeColor} !important;
    }
    #yt-lyrics-body .lyric-romaji {
      color: ${theme.romajiColor} !important;
    }
    #yt-lyrics-body .lyric-id {
      color: ${theme.translationColor} !important;
    }
    #yt-lyrics-body .lyric-translation {
      color: ${theme.translationColor} !important;
    }
  `;
}

chrome.storage.local.get('uiConfig', ({ uiConfig }) => {
  applyUiTheme(uiConfig);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.uiConfig) {
    applyUiTheme(changes.uiConfig.newValue);
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

// Pengaturan terjemahan (chrome.storage.local "translateConfig").
// Toggle hanya menampilkan/menyembunyikan terjemahan; proses AI tidak dipengaruhi toggle.
let showTranslation = true;
let translateLang = 'id';
let translateRequestInFlight = false;

function applyTranslateSettings(config = {}) {
  showTranslation = config.show !== false;
  translateLang = config.language || 'id';
  bodyEl.classList.toggle('hide-translation', !showTranslation);
  if (currentLyricsPayload?.type === 'synced') {
    renderCurrentPayload();
    ensureTranslation();
  }
}

function toggleTranslationDisplay() {
  chrome.storage.local.get('translateConfig', ({ translateConfig = {} }) => {
    chrome.storage.local.set({ translateConfig: { ...translateConfig, show: !showTranslation } });
  });
}

chrome.storage.local.get('translateConfig', ({ translateConfig }) => {
  applyTranslateSettings(translateConfig);
});

function roundOffset(value) {
  return Math.round(value * 10) / 10;
}

function updateActionButtons() {
  actionsEl.innerHTML = '';
  const button = (text, className, title, handler) => {
    const element = document.createElement('button');
    element.className = `yt-lyric-btn ${className}`;
    element.textContent = text;
    element.title = title;
    element.onclick = handler;
    return element;
  };

  if (currentSongInfo?.fullName && !isLoading) {
    actionsEl.appendChild(button('Refresh', '', 'Ambil ulang lirik', () => {
      chrome.runtime.sendMessage({ action: 'getActiveVideoInfo' }, (activeInfo) => {
        if (chrome.runtime.lastError || !activeInfo?.songTitle) {
          bodyEl.innerHTML = 'Tidak ada video YouTube aktif.';
          return;
        }
        loadLyrics(activeInfo);
      });
    }));
  }

  if (isLoading && !isStopped) {
    actionsEl.appendChild(button('Stop', 'yt-lyric-btn-danger', 'Hentikan proses otomatis', () => {
      isStopped = true;
      currentLoadToken += 1;
      isLoading = false;
      bodyEl.innerHTML = 'Proses dihentikan manual.';
      updateActionButtons();
    }));
  }

  actionsEl.appendChild(button(
    showTranslation ? 'Terj: ON' : 'Terj: OFF',
    showTranslation ? 'yt-lyric-btn-primary' : '',
    'Tampilkan/sembunyikan terjemahan per baris (proses AI tetap berjalan)',
    toggleTranslationDisplay
  ));
  if (!currentSongInfo?.fullName || !currentLyricsPayload || isLoading) return;

  if (isFromCache) {
    actionsEl.appendChild(button('Hapus', 'yt-lyric-btn-danger', 'Hapus lirik tersimpan', () => {
      deleteLyrics(currentSongInfo.fullName, refreshMgmtListIfOpen);
    }));
  } else {
    actionsEl.appendChild(button('Simpan', 'yt-lyric-btn-primary', 'Simpan lirik ke local storage', () => {
      const payload = withCurrentVideoMetadata(currentLyricsPayload);
      chrome.storage.local.set({ [currentSongInfo.fullName]: payload }, () => {
        currentLyricsPayload = payload;
        isFromCache = true;
        updateActionButtons();
        refreshMgmtListIfOpen();
      });
    }));
  }

  if (currentLyricsPayload.type === 'synced') {
    const offset = currentLyricsPayload.offset || 0;
    actionsEl.appendChild(button('-0.1s', '', 'Lirik muncul 0.1 detik lebih lambat', () => updateTimestampOffset(0.1)));
    actionsEl.appendChild(button('+0.1s', '', 'Lirik muncul 0.1 detik lebih cepat', () => updateTimestampOffset(-0.1)));
    const resetBtn = button('Reset', 'yt-lyric-btn-danger', 'Kembalikan timestamp ke sumber asli', resetTimestamp);
    if (offset === 0) {
      resetBtn.disabled = true;
      resetBtn.style.opacity = '0.5';
      resetBtn.style.cursor = 'not-allowed';
    }
    actionsEl.appendChild(resetBtn);
  }
}

function updateOffsetInfo() {
  const offset = currentLyricsPayload?.type === 'synced' ? currentLyricsPayload.offset || 0 : 0;
  offsetEl.textContent = currentLyricsPayload?.type === 'synced'
    ? `Sinkronisasi: ${offset >= 0 ? '+' : ''}${offset.toFixed(1)}s`
    : '';
}

function persistCurrentLyrics() {
  if (!isFromCache || !currentSongInfo || !currentLyricsPayload) return;
  chrome.storage.local.set({ [currentSongInfo.fullName]: currentLyricsPayload });
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

// Terjemahan selalu diproses AI ke bahasa pilihan (apa pun status toggle) dan
// disimpan ke storage; toggle hanya memengaruhi tampilan.
function ensureTranslation() {
  const payload = currentLyricsPayload;
  if (!payload || payload.type !== 'synced' || !payload.data) return;
  if (payload.translateLang === translateLang) return; // bahasa ini sudah diproses
  if (translateRequestInFlight) return;

  translateRequestInFlight = true;
  const targetPayload = payload;
  chrome.runtime.sendMessage({ action: 'translateLyrics', lyrics: payload.data, info: currentSongInfo }, (response) => {
    translateRequestInFlight = false;
    if (chrome.runtime.lastError || currentLyricsPayload !== targetPayload) return;
    targetPayload.translateLang = response?.translateLang || translateLang;
    targetPayload.translations = Array.isArray(response?.translations) ? response.translations : null;
    if (isFromCache) persistCurrentLyrics();
    if (targetPayload.translations) renderCurrentPayload();
    ensureTranslation(); // proses ulang bila bahasa berubah saat permintaan berjalan
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

function deleteLyrics(key, callback) {
  chrome.storage.local.remove(key, () => {
    isFromCache = false;
    updateActionButtons();
    callback?.();
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
  if (!payload || !Array.isArray(payload.translations)) return null;
  if (payload.translateLang && payload.translateLang !== translateLang) return null;
  return payload.translations;
}

function renderSyncedLyrics(lines) {
  parsedLyrics = lines
    .filter((line) => Number.isFinite(line.time) && line.text)
    .sort((a, b) => a.time - b.time);
  const translations = getPayloadTranslations();
  activeLyricIndex = -1;
  bodyEl.innerHTML = '';
  parsedLyrics.forEach((line, index) => {
    const p = document.createElement('p');
    p.id = `lyric-line-${index}`;
    p.className = 'lyric-sync-line';
    p.textContent = line.text;
    if (showTranslation && translations && typeof translations[line.trIndex] === 'string') {
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
    payload = {
      type: 'synced',
      data: payload.originalData || payload.data,
      originalData: payload.originalData || payload.data,
      offset: roundOffset(Number(payload.offset) || 0),
      translations: Array.isArray(payload.translations) ? payload.translations : null,
      translateLang: payload.translateLang || null,
      lrclibId: Number.isInteger(payload.lrclibId) ? payload.lrclibId : null,
      videos: Array.isArray(payload.videos) ? payload.videos : []
    };
  }
  currentLyricsPayload = payload;
  isFromCache = fromCache;
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
  bodyEl.innerHTML = payload.data || 'Lirik tidak ditemukan.';
}

function loadLyrics(info, forceFetch = false) {
  const loadToken = ++currentLoadToken;
  const isCurrentLoad = () => !isStopped && loadToken === currentLoadToken;
    currentSongInfo = info;
    currentLyricsPayload = null;
    isFromCache = false;
  isStopped = false;
    parsedLyrics = [];
    activeLyricIndex = -1;
    titleEl.textContent = `Lagu: ${info.fullName}`;
    offsetEl.textContent = '';
    isLoading = true;
    updateActionButtons();

    const fetchLyrics = () => {
      if (!isCurrentLoad()) return;
        bodyEl.innerHTML = '<div class="loading">Mencari lirik sinkron di LRCLIB...</div>';
        chrome.runtime.sendMessage({ action: 'fetchSyncedLyrics', info }, (response) => {
        if (!isCurrentLoad()) return;
            if (chrome.runtime.lastError) {
              isLoading = false;
              updateActionButtons();
              bodyEl.innerHTML = 'Gagal menghubungi layanan lirik.';
                return;
            }
            if (response?.success && response.lyrics && parseLRC(response.lyrics).length) {
              displayLyrics({
                type: 'synced',
                data: response.lyrics,
                originalData: response.lyrics,
                offset: 0,
                translations: response.translations || null,
                translateLang: response.translateLang || null,
                lrclibId: response.lrclibId || null
              }, false);
                isLoading = false;
                updateActionButtons();
                return;
            }

              if (!isCurrentLoad()) return;
            bodyEl.innerHTML = '<div class="loading">Lirik sinkron tidak ada. Mencari teks biasa...</div>';
            chrome.runtime.sendMessage({ action: 'fetchLyrics', info }, (plainResponse) => {
                if (!isCurrentLoad()) return;
                if (chrome.runtime.lastError) {
                  isLoading = false;
                  updateActionButtons();
                    bodyEl.innerHTML = 'Gagal menghubungi layanan lirik.';
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

    chrome.storage.local.get(info.fullName, (result) => {
    if (!isCurrentLoad()) return;
        if (result[info.fullName]) {
        isLoading = false;
            const cachedPayload = withCurrentVideoMetadata(result[info.fullName]);
            if (cachedPayload !== result[info.fullName]) {
              chrome.storage.local.set({ [info.fullName]: cachedPayload });
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
  bodyEl.innerHTML = '<div class="loading">Memuat lirik dari URL LRCLIB...</div>';
  chrome.runtime.sendMessage({ action: 'fetchLyricsByLrclibUrl', url, info: currentSongInfo }, (response) => {
    if (!isCurrentLoad()) return;
    isLoading = false;
    if (chrome.runtime.lastError || !response?.success || !response.lyrics) {
      bodyEl.innerHTML = response?.error || 'Gagal memuat URL LRCLIB.';
      updateActionButtons();
      return;
    }
    displayLyrics({ type: 'synced', data: response.lyrics, originalData: response.lyrics, offset: 0, translations: response.translations || null, translateLang: response.translateLang || null, lrclibId: response.lrclibId || null }, false);
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
    current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

const isYTPage = location.hostname.includes('youtube.com');

function getYouTubeVideoId() {
  if (!isYTPage) return null;
  return new URLSearchParams(location.search).get('v') || null;
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
    const info = getYouTubeInfo();
    if (info?.songTitle) {
      loadLyrics(info);
    }
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

  chrome.runtime.sendMessage({ action: 'getRawTitle' }, (response) => {
    if (chrome.runtime.lastError || !response?.songTitle) return;
    if (!currentSongInfo || response.fullName !== currentSongInfo.fullName) {
      loadLyrics(response);
    }
  });
}, 300);

// 2. Fungsi Ekstrak Judul
function getYouTubeInfo() {
    // Ambil teks judul mentah
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string');
    let rawTitle = titleElement ? titleElement.textContent.trim() : document.title.replace(' - YouTube', '').replace(/^\(\d+\)\s/, '').trim();
    
    // Ambil nama channel YouTube (biasanya nama artisnya)
    const channelElement = document.querySelector('ytd-video-owner-renderer yt-formatted-string a, ytd-channel-name yt-formatted-string a');
    let channelName = channelElement ? channelElement.textContent.trim() : "";
    // YouTube Music sering menambahkan " - Topic" di belakang nama channel artis
    channelName = channelName.replace(/ - Topic$/i, '').trim();
  
    // Bersihkan embel-embel dari judul
    let cleanTitle = rawTitle.replace(/\[.*?\]|\(.*?\)|(official|video|audio|lyrics|music|mv)/gi, '').trim();
    
    let artist = channelName;
    let title = cleanTitle;
  
    // Jika format judul sudah "Artis - Judul", kita pisahkan
    if (cleanTitle.includes('-')) {
      let parts = cleanTitle.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim(); // Jika ada '-' lagi di judul lagu
    }
  
    return { 
      artist: artist, 
      songTitle: title, 
      fullName: `${artist} - ${title}` // Contoh: "Yorushika - Nautilus"
    };
  }

  // 3. Logika Menarik/Menggeser Widget (Draggable)
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0, yOffset = 0;
  
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === header || e.target.parentNode === header) {
      isDragging = true;
      header.style.cursor = 'grabbing';
    }
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
    header.style.cursor = 'grab';
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
      widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
      
      if (widget.style.display === 'block') {
        const info = request.info; // Data sekarang berbentuk objek
        
        if (!info || !info.songTitle) {
          currentSongInfo = null;
          currentLyricsPayload = null;
          updateActionButtons();
          titleEl.textContent = "Error";
          bodyEl.innerHTML = "Tidak ada video YouTube yang sedang diputar.";
          return;
        }
        if (isYTPage) {
          lastYouTubeVideoId = getYouTubeVideoId();
        }
        loadLyrics(info);
      }
    }

    if (request.action === "updateStatus") {
        // Cari elemen loading di dalam widget
        const loadingEl = document.querySelector('#yt-lyrics-body .loading');
        if (loadingEl) {
          loadingEl.textContent = request.status;
        }
      }
  });