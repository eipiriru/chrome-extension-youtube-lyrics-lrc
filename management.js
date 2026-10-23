// management.js — halaman popup untuk manajemen lirik tersimpan
const listEl = document.getElementById('list');
const countEl = document.getElementById('count');
const searchEl = document.getElementById('search');
const clearAllBtn = document.getElementById('clear-all');
const exportLyricsBtn = document.getElementById('export-lyrics');
const exportSelectedBtn = document.getElementById('export-selected');
const deleteSelectedBtn = document.getElementById('delete-selected');
const selectAllEl = document.getElementById('select-all');
const importLyricsBtn = document.getElementById('import-lyrics');
const loadLyricsPackBtn = document.getElementById('load-lyrics-pack');
const importFileEl = document.getElementById('import-file');
const geminiEnabledEl = document.getElementById('cfg-gemini-enabled');
const geminiKeyEl = document.getElementById('cfg-gemini-key');
const nineRouterEnabledEl = document.getElementById('cfg-9router-enabled');
const nineRouterUrlEl = document.getElementById('cfg-9router-url');
const nineRouterKeyEl = document.getElementById('cfg-9router-key');
const nineRouterModelEl = document.getElementById('cfg-9router-model');
const openRouterEnabledEl = document.getElementById('cfg-openrouter-enabled');
const openRouterKeyEl = document.getElementById('cfg-openrouter-key');
const openRouterModelEl = document.getElementById('cfg-openrouter-model');
const saveConfigBtn = document.getElementById('cfg-save');
const resetConfigBtn = document.getElementById('cfg-reset');
const uiBgColorEl = document.getElementById('cfg-ui-bg-color');
const uiBgOpacityEl = document.getElementById('cfg-ui-bg-opacity');
const uiBgOpacityValEl = document.getElementById('cfg-ui-bg-opacity-val');
const uiBackdropBlurEl = document.getElementById('cfg-ui-backdrop-blur');
const uiActiveColorEl = document.getElementById('cfg-ui-active-color');
const uiInactiveColorEl = document.getElementById('cfg-ui-inactive-color');
const uiRomajiColorEl = document.getElementById('cfg-ui-romaji-color');
const uiTranslationColorEl = document.getElementById('cfg-ui-translation-color');
const uiShowOriginalEl = document.getElementById('cfg-ui-show-original');
const uiTextStyles = ['active', 'inactive', 'original', 'romaji', 'translation'].map((role) => ({
  role,
  size: document.getElementById(`cfg-ui-${role}-font-size`),
  color: document.getElementById(`cfg-ui-${role}-color`),
  toggles: Array.from(document.querySelectorAll(`[data-style-role="${role}"]`))
}));
const saveUiConfigBtn = document.getElementById('cfg-ui-save');
const resetUiConfigBtn = document.getElementById('cfg-ui-reset');
const translateLangEl = document.getElementById('cfg-translate-lang');
const translateShowEl = document.getElementById('cfg-translate-show');
const saveTranslateConfigBtn = document.getElementById('cfg-translate-save');
const resetTranslateConfigBtn = document.getElementById('cfg-translate-reset');
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
document.getElementById('app-version').textContent = `Versi ${chrome.runtime.getManifest().version}`;

const DEFAULT_UI_CONFIG = {
  backgroundColor: '#181818',
  backgroundOpacity: 95,
  backdropBlur: 2,
  activeColor: '#ffffff',
  inactiveColor: '#a6a6a6',
  romajiColor: '#a9c7ff',
  translationColor: '#a6dfb5',
  showOriginal: true,
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

const DEFAULT_TRANSLATE_CONFIG = {
  language: 'id',
  show: true
};

let savedItems = [];
const selectedKeys = new Set();

function normalizedKey(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function lyricRecord(key, payload) {
  const separator = key.indexOf(' - ');
  const artistName = separator < 0 ? '' : key.slice(0, separator).trim();
  const trackName = separator < 0 ? key.trim() : key.slice(separator + 3).trim();
  const syncedLyrics = payload?.originalData || payload?.data || '';
  return {
    key: normalizedKey(`${artistName} ${trackName}`),
    trackName,
    artistName,
    lrclibId: Number.isInteger(payload?.lrclibId) ? payload.lrclibId : null,
    lrclibUrl: typeof payload?.lrclibUrl === 'string' ? payload.lrclibUrl : null,
    videos: Array.isArray(payload?.videos) ? payload.videos : [],
    syncedLyrics,
    romajiLyrics: payload?.data || '',
    showOriginal: typeof payload?.showOriginal === 'boolean' ? payload.showOriginal : undefined,
    showTranslation: typeof payload?.showTranslation === 'boolean' ? payload.showTranslation : undefined,
    translations: payload?.translateLang && Array.isArray(payload?.translations)
      ? { [payload.translateLang]: payload.translations }
      : {},
    translateLang: payload?.translateLang || null,
    offset: Number.isFinite(payload?.offset) ? payload.offset : 0,
    type: payload?.type === 'synced' ? 'synced' : 'plain'
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
      data: item.type === 'synced' ? (item.romajiLyrics || item.syncedLyrics) : item.syncedLyrics,
      lrclibId: Number.isInteger(item.lrclibId) ? item.lrclibId : null,
      lrclibUrl: typeof item.lrclibUrl === 'string' && /^https:\/\/lrclib\.net\/tracks\/\d+\/?$/.test(item.lrclibUrl) ? item.lrclibUrl : '',
      ...(typeof item.showOriginal === 'boolean' ? { showOriginal: item.showOriginal } : {}),
      ...(typeof item.showTranslation === 'boolean' ? { showTranslation: item.showTranslation } : {}),
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

function exportLyricsPack(items = savedItems) {
  const targetItems = Array.isArray(items) ? items : savedItems;
  if (!targetItems.length) {
    showStatus('Tidak ada lirik untuk diekspor.');
    return;
  }
  try {
    const pack = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      lyrics: targetItems.map(({ key, payload }) => lyricRecord(key, payload))
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'youtube-lyrics-pack.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(`${pack.lyrics.length} lagu diekspor.`);
  } catch (err) {
    showStatus(`Gagal mengekspor: ${err.message}`);
  }
}

exportLyricsBtn.onclick = () => exportLyricsPack(savedItems);
exportSelectedBtn.onclick = () => exportLyricsPack(savedItems.filter(({ key }) => selectedKeys.has(key)));
deleteSelectedBtn.onclick = deleteSelectedLyrics;
selectAllEl.onchange = () => {
  const query = searchEl.value.trim().toLowerCase();
  const visible = query ? savedItems.filter(({ key }) => key.toLowerCase().includes(query)) : savedItems;
  visible.forEach(({ key }) => selectAllEl.checked ? selectedKeys.add(key) : selectedKeys.delete(key));
  render();
};
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
  const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
  const statusEl = panel?.querySelector('[data-status]');
  if (!statusEl) return;
  statusEl.textContent = message;
  clearTimeout(statusEl.statusTimer);
  statusEl.statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 2500);
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

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-select';
    checkbox.checked = selectedKeys.has(key);
    checkbox.setAttribute('aria-label', `Pilih ${key}`);
    row.tabIndex = 0;
    row.setAttribute('aria-selected', String(checkbox.checked));
    checkbox.onchange = () => {
      checkbox.checked ? selectedKeys.add(key) : selectedKeys.delete(key);
      row.setAttribute('aria-selected', String(checkbox.checked));
      updateSelectionControls(items);
    };
    row.onclick = (event) => {
      if (event.target.closest('button, a, input, label')) return;
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    };
    row.onkeydown = (event) => {
      if (event.target !== row || ![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    };

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

    if (payload?.lrclibUrl) {
      const lrcUrl = document.createElement('a');
      lrcUrl.className = 'item-lrc-url';
      lrcUrl.href = payload.lrclibUrl;
      lrcUrl.target = '_blank';
      lrcUrl.rel = 'noopener noreferrer';
      lrcUrl.textContent = payload.lrclibUrl;
      lrcUrl.title = payload.lrclibUrl;
      info.appendChild(lrcUrl);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-danger';
    delBtn.textContent = 'Hapus';
    delBtn.onclick = () => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          showStatus(`Gagal menghapus "${key}": ${chrome.runtime.lastError.message}`);
          return;
        }
        loadItems();
        showStatus(`"${key}" dihapus.`);
      });
    };

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.appendChild(delBtn);
    row.appendChild(checkbox);
    row.appendChild(info);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
  updateSelectionControls(items);
}

function updateSelectionControls(visibleItems) {
  const visibleKeys = visibleItems.map(({ key }) => key);
  const selectedVisibleCount = visibleKeys.filter((key) => selectedKeys.has(key)).length;
  selectAllEl.checked = visibleKeys.length > 0 && selectedVisibleCount === visibleKeys.length;
  selectAllEl.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleKeys.length;
  const selectedCount = selectedKeys.size;
  exportSelectedBtn.hidden = selectedCount === 0;
  deleteSelectedBtn.hidden = selectedCount === 0;
  countEl.textContent = `${savedItems.length} lagu${selectedCount ? ` · ${selectedCount} dipilih` : ''}`;
}

function deleteSelectedLyrics() {
  const keys = [...selectedKeys].filter((key) => savedItems.some((item) => item.key === key));
  if (!keys.length || !confirm(`Hapus ${keys.length} lirik terpilih?`)) return;
  chrome.storage.local.remove(keys, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Gagal menghapus: ${chrome.runtime.lastError.message}`);
      return;
    }
    keys.forEach((key) => selectedKeys.delete(key));
    loadItems();
    showStatus(`${keys.length} lirik dihapus.`);
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
    geminiEnabledEl.checked = aiConfig.geminiEnabled !== false;
    geminiKeyEl.value = aiConfig.geminiApiKey || '';
    nineRouterEnabledEl.checked = aiConfig.nineRouterEnabled !== false;
    nineRouterUrlEl.value = aiConfig.nineRouterUrl || '';
    nineRouterKeyEl.value = aiConfig.nineRouterApiKey || '';
    nineRouterModelEl.value = aiConfig.nineRouterModel || '';
    openRouterEnabledEl.checked = aiConfig.openRouterEnabled !== false;
    openRouterKeyEl.value = aiConfig.openRouterApiKey || '';
    openRouterModelEl.value = aiConfig.openRouterModel || '';
    loadUiConfig(uiConfig);
    loadTranslateConfig(translateConfig);
  });
}

function loadUiConfig(config = {}) {
  const ui = { ...DEFAULT_UI_CONFIG, ...config };
  uiBgColorEl.value = ui.backgroundColor;
  uiBgOpacityEl.value = ui.backgroundOpacity;
  uiBgOpacityValEl.textContent = `${ui.backgroundOpacity}%`;
  uiBackdropBlurEl.value = Math.min(20, Math.max(0, Number(ui.backdropBlur) || 0));
  uiShowOriginalEl.checked = ui.showOriginal !== false;
  uiTextStyles.forEach(({ role, size, color, toggles }) => {
    size.value = Math.min(48, Math.max(8, Number(ui[`${role}FontSize`]) || DEFAULT_UI_CONFIG[`${role}FontSize`]));
    color.value = ui[`${role}Color`];
    const fontStyle = ['normal', 'bold', 'italic', 'bold-italic'].includes(ui[`${role}FontStyle`])
      ? ui[`${role}FontStyle`] : DEFAULT_UI_CONFIG[`${role}FontStyle`];
    toggles.forEach((button) => {
      button.setAttribute('aria-pressed', String(fontStyle.includes(button.dataset.style)));
    });
  });
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
    backdropBlur: Math.min(20, Math.max(0, Number(uiBackdropBlurEl.value) || 0)),
    showOriginal: uiShowOriginalEl.checked,
    ...Object.fromEntries(uiTextStyles.flatMap(({ role, size, color, toggles }) => [
      [`${role}Color`, color.value],
      [`${role}FontSize`, Math.min(48, Math.max(8, Number(size.value) || 8))],
      [`${role}FontStyle`, toggles.filter((button) => button.getAttribute('aria-pressed') === 'true').map((button) => button.dataset.style).join('-') || 'normal']
    ]))
  };
}

function getConfigFromForm() {
  return {
    geminiEnabled: geminiEnabledEl.checked,
    geminiApiKey: geminiKeyEl.value.trim(),
    nineRouterEnabled: nineRouterEnabledEl.checked,
    nineRouterUrl: nineRouterUrlEl.value.trim(),
    nineRouterApiKey: nineRouterKeyEl.value.trim(),
    nineRouterModel: nineRouterModelEl.value.trim(),
    openRouterEnabled: openRouterEnabledEl.checked,
    openRouterApiKey: openRouterKeyEl.value.trim(),
    openRouterModel: openRouterModelEl.value.trim(),
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

uiShowOriginalEl.onchange = () => {
  chrome.storage.local.get('uiConfig', ({ uiConfig = {} }) => {
    chrome.storage.local.set({ uiConfig: { ...uiConfig, showOriginal: uiShowOriginalEl.checked } });
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

document.querySelectorAll('.style-toggle').forEach((button) => {
  button.onclick = () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
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
