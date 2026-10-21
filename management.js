// management.js — halaman popup untuk manajemen lirik tersimpan
const listEl = document.getElementById('list');
const countEl = document.getElementById('count');
const searchEl = document.getElementById('search');
const clearAllBtn = document.getElementById('clear-all');
const statusEl = document.getElementById('status');
const exportLyricsBtn = document.getElementById('export-lyrics');
const importLyricsBtn = document.getElementById('import-lyrics');
const loadLyricsPackBtn = document.getElementById('load-lyrics-pack');
const importFileEl = document.getElementById('import-file');
const geminiKeyEl = document.getElementById('cfg-gemini-key');
const nineRouterUrlEl = document.getElementById('cfg-9router-url');
const nineRouterKeyEl = document.getElementById('cfg-9router-key');
const nineRouterModelEl = document.getElementById('cfg-9router-model');
const saveConfigBtn = document.getElementById('cfg-save');
const resetConfigBtn = document.getElementById('cfg-reset');
const uiBgColorEl = document.getElementById('cfg-ui-bg-color');
const uiBgOpacityEl = document.getElementById('cfg-ui-bg-opacity');
const uiBgOpacityValEl = document.getElementById('cfg-ui-bg-opacity-val');
const uiActiveColorEl = document.getElementById('cfg-ui-active-color');
const uiInactiveColorEl = document.getElementById('cfg-ui-inactive-color');
const uiRomajiColorEl = document.getElementById('cfg-ui-romaji-color');
const uiTranslationColorEl = document.getElementById('cfg-ui-translation-color');
const uiFontSizeEl = document.getElementById('cfg-ui-font-size');
const uiFontSizeValEl = document.getElementById('cfg-ui-font-size-val');
const saveUiConfigBtn = document.getElementById('cfg-ui-save');
const resetUiConfigBtn = document.getElementById('cfg-ui-reset');
const translateLangEl = document.getElementById('cfg-translate-lang');
const translateShowEl = document.getElementById('cfg-translate-show');
const saveTranslateConfigBtn = document.getElementById('cfg-translate-save');
const resetTranslateConfigBtn = document.getElementById('cfg-translate-reset');
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

const DEFAULT_UI_CONFIG = {
  backgroundColor: '#181818',
  backgroundOpacity: 95,
  activeColor: '#ffffff',
  inactiveColor: '#888888',
  romajiColor: '#8ab4f8',
  translationColor: '#81c995',
  activeFontSize: 20
};

const DEFAULT_TRANSLATE_CONFIG = {
  language: 'id',
  show: true
};

let savedItems = [];

function normalizedKey(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function lyricRecord(key, payload) {
  const separator = key.indexOf(' - ');
  const artistName = separator < 0 ? '' : key.slice(0, separator).trim();
  const trackName = separator < 0 ? key.trim() : key.slice(separator + 3).trim();
  const syncedLyrics = payload.originalData || payload.data;
  return {
    key: normalizedKey(`${artistName} ${trackName}`),
    trackName,
    artistName,
    lrclibId: Number.isInteger(payload.lrclibId) ? payload.lrclibId : null,
    videos: Array.isArray(payload.videos) ? payload.videos : [],
    syncedLyrics,
    translations: payload.translateLang && Array.isArray(payload.translations)
      ? { [payload.translateLang]: payload.translations }
      : {},
    translateLang: payload.translateLang || null,
    offset: Number.isFinite(payload.offset) ? payload.offset : 0,
    type: payload.type === 'synced' ? 'synced' : 'plain'
  };
}

function parseLyricsPack(pack) {
  if (!pack || pack.schemaVersion !== 1 || !Array.isArray(pack.lyrics) || pack.lyrics.length > 10000) {
    throw new Error('Format pack tidak valid atau schemaVersion tidak didukung.');
  }
  return pack.lyrics.map((item) => {
    if (!item || typeof item.trackName !== 'string' || !item.trackName.trim() || typeof item.artistName !== 'string' ||
        !['synced', 'plain'].includes(item.type) || typeof item.syncedLyrics !== 'string' || !item.syncedLyrics.trim()) {
      throw new Error('Pack berisi data lagu yang tidak valid.');
    }
    const key = `${item.artistName.trim()} - ${item.trackName.trim()}`;
    const translations = item.translations && typeof item.translations === 'object' && !Array.isArray(item.translations)
      ? item.translations : {};
    const language = ['id', 'en'].includes(item.translateLang) ? item.translateLang
      : ['id', 'en'].find((lang) => Array.isArray(translations[lang])) || null;
    const videos = Array.isArray(item.videos) ? item.videos.filter((video) =>
      video && typeof video.videoId === 'string' && /^[\w-]{11}$/.test(video.videoId) &&
      (video.duration === null || (Number.isFinite(video.duration) && video.duration > 0))
    ).map(({ videoId, duration }) => ({ videoId, duration }))
      : Array.isArray(item.videoIds) ? item.videoIds.filter((videoId) => typeof videoId === 'string' && /^[\w-]{11}$/.test(videoId)).map((videoId) => ({ videoId, duration: null })) : [];
    const translatedLines = language && Array.isArray(translations[language]) &&
      translations[language].every((line) => typeof line === 'string') ? translations[language] : null;
    const payload = {
      type: item.type,
      data: item.syncedLyrics,
      lrclibId: Number.isInteger(item.lrclibId) ? item.lrclibId : null,
      videos
    };
    return {
      key,
      payload: item.type === 'synced'
        ? { ...payload, originalData: item.syncedLyrics, offset: Number.isFinite(item.offset) ? item.offset : 0, translations: translatedLines, translateLang: translatedLines ? language : null }
        : payload
    };
  });
}

async function mergeLyricsPack(pack) {
  const imported = parseLyricsPack(pack);
  const existing = await chrome.storage.local.get(null);
  const additions = {};
  const existingKeys = new Set(Object.keys(existing).map(normalizedKey));
  imported.forEach(({ key, payload }) => {
    const matchKey = normalizedKey(key);
    if (!existingKeys.has(matchKey)) {
      additions[key] = payload;
      existingKeys.add(matchKey);
    }
  });
  const keys = Object.keys(additions);
  if (keys.length) await chrome.storage.local.set(additions);
  return { added: keys.length, skipped: imported.length - keys.length };
}

function exportLyricsPack() {
  const pack = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    lyrics: savedItems.map(({ key, payload }) => lyricRecord(key, payload))
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'youtube-lyrics-pack.json';
  link.click();
  URL.revokeObjectURL(url);
  showStatus(`${pack.lyrics.length} lagu diekspor.`);
}

exportLyricsBtn.onclick = exportLyricsPack;
importLyricsBtn.onclick = () => importFileEl.click();
importFileEl.onchange = async () => {
  const file = importFileEl.files[0];
  importFileEl.value = '';
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return showStatus('Ukuran file melebihi batas 5 MB.');
  try {
    const result = await mergeLyricsPack(JSON.parse(await file.text()));
    showStatus(`Impor selesai: ${result.added} ditambahkan, ${result.skipped} dilewati.`);
  } catch (error) {
    showStatus(`Impor gagal: ${error.message}`);
  }
};

loadLyricsPackBtn.onclick = () => {
  loadLyricsPackBtn.disabled = true;
  chrome.runtime.sendMessage({ action: 'fetchLyricsPack' }, async (response) => {
    loadLyricsPackBtn.disabled = false;
    if (chrome.runtime.lastError || !response?.success) {
      showStatus(`Gagal memuat pack: ${response?.error || chrome.runtime.lastError?.message || 'Kesalahan tidak diketahui.'}`);
      return;
    }
    try {
      const result = await mergeLyricsPack(response.pack);
      showStatus(`Pack dimuat: ${result.added} ditambahkan, ${result.skipped} dilewati.`);
    } catch (error) {
      showStatus(`Pack tidak valid: ${error.message}`);
    }
  });
};

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => { statusEl.textContent = ''; }, 2500);
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  const items = query
    ? savedItems.filter((item) => item.key.toLowerCase().includes(query))
    : savedItems;

  listEl.innerHTML = '';
  countEl.textContent = `${savedItems.length} lagu`;

  if (savedItems.length === 0) {
    listEl.innerHTML = '<div class="empty">Belum ada lirik yang tersimpan.</div>';
    return;
  }
  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty">Tidak ada lagu yang cocok.</div>';
    return;
  }

  items.forEach(({ key, payload }) => {
    const row = document.createElement('div');
    row.className = 'item';

    const info = document.createElement('div');
    info.className = 'item-info';

    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = key;
    title.title = key;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    const type = payload?.type === 'synced' ? 'Bertimestamp (karaoke)' : 'Teks biasa';
    const offset = payload?.type === 'synced' && payload.offset
      ? ` • Offset ${payload.offset > 0 ? '+' : ''}${payload.offset}s`
      : '';
    meta.textContent = `${type}${offset}`;

    info.appendChild(title);
    info.appendChild(meta);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-danger';
    delBtn.textContent = 'Hapus';
    delBtn.onclick = () => {
      chrome.storage.local.remove(key, () => {
        showStatus(`"${key}" dihapus.`);
      });
    };

    row.appendChild(info);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  });
}

function loadItems() {
  chrome.storage.local.get(null, (items) => {
    savedItems = Object.keys(items)
      .filter((key) => key !== 'debug' && items[key] && typeof items[key] === 'object' && 'data' in items[key])
      .sort()
      .map((key) => ({ key, payload: items[key] }));
    render();
  });
}

function loadConfig() {
  chrome.storage.local.get(['aiConfig', 'uiConfig', 'translateConfig'], ({ aiConfig = {}, uiConfig = {}, translateConfig = {} }) => {
    geminiKeyEl.value = aiConfig.geminiApiKey || '';
    nineRouterUrlEl.value = aiConfig.nineRouterUrl || '';
    nineRouterKeyEl.value = aiConfig.nineRouterApiKey || '';
    nineRouterModelEl.value = aiConfig.nineRouterModel || '';
    loadUiConfig(uiConfig);
    loadTranslateConfig(translateConfig);
  });
}

function loadUiConfig(config = {}) {
  const ui = { ...DEFAULT_UI_CONFIG, ...config };
  uiBgColorEl.value = ui.backgroundColor;
  uiBgOpacityEl.value = ui.backgroundOpacity;
  uiBgOpacityValEl.textContent = `${ui.backgroundOpacity}%`;
  uiActiveColorEl.value = ui.activeColor;
  uiInactiveColorEl.value = ui.inactiveColor;
  uiRomajiColorEl.value = ui.romajiColor;
  uiTranslationColorEl.value = ui.translationColor;
  uiFontSizeEl.value = ui.activeFontSize;
  uiFontSizeValEl.textContent = `${ui.activeFontSize}px`;
}

function loadTranslateConfig(config = {}) {
  const translate = { ...DEFAULT_TRANSLATE_CONFIG, ...config };
  translateLangEl.value = translate.language === 'en' ? 'en' : 'id';
  translateShowEl.checked = translate.show !== false;
}

function getUiConfigFromForm() {
  return {
    backgroundColor: uiBgColorEl.value,
    backgroundOpacity: Number(uiBgOpacityEl.value),
    activeColor: uiActiveColorEl.value,
    inactiveColor: uiInactiveColorEl.value,
    romajiColor: uiRomajiColorEl.value,
    translationColor: uiTranslationColorEl.value,
    activeFontSize: Number(uiFontSizeEl.value)
  };
}

function getConfigFromForm() {
  return {
    geminiApiKey: geminiKeyEl.value.trim(),
    nineRouterUrl: nineRouterUrlEl.value.trim(),
    nineRouterApiKey: nineRouterKeyEl.value.trim(),
    nineRouterModel: nineRouterModelEl.value.trim()
  };
}

clearAllBtn.onclick = () => {
  if (!confirm('Hapus semua lirik yang tersimpan?')) return;
  chrome.storage.local.get(null, (items) => {
    const lyricKeys = Object.keys(items).filter((key) =>
      items[key] && typeof items[key] === 'object' && 'data' in items[key]
    );
    chrome.storage.local.remove(lyricKeys, () => {
      showStatus('Semua lirik dihapus. Konfigurasi AI tetap tersimpan.');
      loadItems();
    });
  });
};

searchEl.oninput = render;

saveConfigBtn.onclick = () => {
  const config = getConfigFromForm();
  if (config.nineRouterUrl) {
    try {
      new URL(config.nineRouterUrl);
    } catch {
      showStatus('Base URL 9Router tidak valid.');
      return;
    }
  }
  chrome.storage.local.set({ aiConfig: config }, () => {
    showStatus('Konfigurasi AI disimpan.');
  });
};

resetConfigBtn.onclick = () => {
  chrome.storage.local.remove('aiConfig', () => {
    loadConfig();
    showStatus('Konfigurasi AI dikembalikan ke default kosong.');
  });
};

uiBgOpacityEl.oninput = () => {
  uiBgOpacityValEl.textContent = `${uiBgOpacityEl.value}%`;
};

uiFontSizeEl.oninput = () => {
  uiFontSizeValEl.textContent = `${uiFontSizeEl.value}px`;
};

saveUiConfigBtn.onclick = () => {
  chrome.storage.local.set({ uiConfig: getUiConfigFromForm() }, () => {
    showStatus('Konfigurasi tampilan disimpan.');
  });
};

resetUiConfigBtn.onclick = () => {
  chrome.storage.local.remove('uiConfig', () => {
    loadUiConfig();
    showStatus('Tampilan dikembalikan ke default.');
  });
};

saveTranslateConfigBtn.onclick = () => {
  const config = {
    language: translateLangEl.value === 'en' ? 'en' : 'id',
    show: translateShowEl.checked
  };
  chrome.storage.local.set({ translateConfig: config }, () => {
    showStatus('Konfigurasi terjemahan disimpan.');
  });
};

resetTranslateConfigBtn.onclick = () => {
  chrome.storage.local.remove('translateConfig', () => {
    loadTranslateConfig();
    showStatus('Konfigurasi terjemahan dikembalikan ke default.');
  });
};

function selectTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}

tabs.forEach((tab) => {
  tab.onclick = () => selectTab(tab);
  tab.onkeydown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.indexOf(tab);
    const index = event.key === 'Home' ? 0
      : event.key === 'End' ? tabs.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[index].focus();
    selectTab(tabs[index]);
  };
});

document.querySelectorAll('.section h2[data-target]').forEach((heading) => {
  heading.onclick = () => heading.closest('.section').classList.toggle('collapsed');
});

// Perbarui daftar otomatis jika widget di tab lain menyimpan/menghapus lirik
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  loadItems();
  if (changes.aiConfig || changes.uiConfig || changes.translateConfig) loadConfig();
});

loadConfig();
loadItems();
