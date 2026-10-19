// management.js — halaman popup untuk manajemen lirik tersimpan
const listEl = document.getElementById('list');
const countEl = document.getElementById('count');
const searchEl = document.getElementById('search');
const clearAllBtn = document.getElementById('clear-all');
const statusEl = document.getElementById('status');
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

const DEFAULT_UI_CONFIG = {
  backgroundColor: '#181818',
  backgroundOpacity: 95,
  activeColor: '#ffffff',
  inactiveColor: '#888888',
  romajiColor: '#8ab4f8',
  translationColor: '#81c995',
  activeFontSize: 20
};

let savedItems = [];

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
  chrome.storage.local.get(['aiConfig', 'uiConfig'], ({ aiConfig = {}, uiConfig = {} }) => {
    geminiKeyEl.value = aiConfig.geminiApiKey || '';
    nineRouterUrlEl.value = aiConfig.nineRouterUrl || '';
    nineRouterKeyEl.value = aiConfig.nineRouterApiKey || '';
    nineRouterModelEl.value = aiConfig.nineRouterModel || '';
    loadUiConfig(uiConfig);
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

document.querySelectorAll('.section h2[data-target]').forEach((heading) => {
  heading.onclick = () => heading.closest('.section').classList.toggle('collapsed');
});

// Perbarui daftar otomatis jika widget di tab lain menyimpan/menghapus lirik
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  loadItems();
  if (changes.aiConfig || changes.uiConfig) loadConfig();
});

loadConfig();
loadItems();
