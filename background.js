// background.js
const DEBUG = false;
const debugLog = (...args) => { if (DEBUG) console.log(...args); };
const debugError = (...args) => { if (DEBUG) console.error(...args); };

// Nilai default; bisa ditimpa lewat konfigurasi di halaman Manajemen (chrome.storage.local "aiConfig")
const DEFAULT_AI_CONFIG = {
  geminiApiKey: "",
  nineRouterUrl: "",
  nineRouterApiKey: "",
  nineRouterModel: ""
};

function getAIConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get("aiConfig", ({ aiConfig }) => {
      resolve({ ...DEFAULT_AI_CONFIG, ...(aiConfig || {}) });
    });
  });
}

chrome.action.onClicked.addListener(async (currentTab) => {
  if (currentTab.url.startsWith("chrome://") || currentTab.url.startsWith("chrome-extension://")) return;

  chrome.tabs.query({ url: "*://*.youtube.com/watch*" }, (ytTabs) => {
    if (ytTabs.length === 0) {
      sendMessageSafely(currentTab.id, { action: "toggleWidget", info: null });
      return;
    }

    const ytTab = ytTabs[0];
    chrome.tabs.sendMessage(ytTab.id, { action: "getRawTitle" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        sendMessageSafely(currentTab.id, { action: "toggleWidget", info: null });
        return;
      }
      sendMessageSafely(currentTab.id, { action: "toggleWidget", info: response });
    });
  });
});

function sendMessageSafely(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, () => { chrome.runtime.lastError; });
}

// Fungsi pembantu untuk mencetak log dan mengirim status ke UI (Widget)
function updateStatus(tabId, message) {
  debugLog(`[Status AI Lyrics]: ${message}`);
  chrome.tabs.sendMessage(tabId, { action: "updateStatus", status: message }, () => { chrome.runtime.lastError; });
}

// Menerima perintah pencarian dari content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideoTime") {
    chrome.tabs.query({ url: "*://*.youtube.com/watch*" }, (ytTabs) => {
      const ytTab = ytTabs.find((tab) => tab.audible) || ytTabs[0];
      if (!ytTab) {
        sendResponse({ time: null });
        return;
      }
      chrome.tabs.sendMessage(ytTab.id, { action: "queryVideoTime" }, (response) => {
        sendResponse(chrome.runtime.lastError || !response ? { time: null } : response);
      });
    });
    return true;
  }
  if (request.action === "getActiveVideoInfo") {
    chrome.tabs.query({ url: "*://*.youtube.com/watch*" }, (ytTabs) => {
      const ytTab = ytTabs.find((tab) => tab.audible) || ytTabs[0];
      if (!ytTab) {
        sendResponse(null);
        return;
      }
      chrome.tabs.sendMessage(ytTab.id, { action: "getRawTitle" }, (response) => {
        sendResponse(chrome.runtime.lastError || !response?.songTitle ? null : response);
      });
    });
    return true;
  }
  if (request.action === "fetchSyncedLyrics") {
    // searchLRCLIB(request.info, sender.tab.id)
    //   .then((res) => sendResponse(res))
    //   .catch((err) => sendResponse({ success: false, error: err.message }));
    // return true;
    debugLog('[YT Lyrics][BG] fetchSyncedLyrics received', request.info);
    searchLRCLIB(request.info, sender.tab.id).then(sendResponse);
    return true; // Asynchronous response
  }
  if (request.action === "fetchLyricsByLrclibUrl") {
    getLRCLIBByUrl(request.url, request.info, sender.tab.id).then(sendResponse);
    return true;
  }
  if (request.action === "fetchLyrics") {
    const tabId = sender.tab.id; // Ambil ID tab yang meminta
    handleLyricsSearch(request.info, tabId).then(sendResponse);
    return true; 
  }
  if (request.action === "openManagementWindow") {
    chrome.windows.create({
      url: chrome.runtime.getURL("management.html"),
      type: "popup",
      width: 560,
      height: 640
    });
    sendResponse({ success: true });
  }
});

async function searchLRCLIB(info, tabId) {
  try {
    updateStatus(tabId, `Mencari lirik bertimestamp: ${info.fullName}`);
    const query = encodeURIComponent(`${info.artist} ${info.songTitle}`);
    const response = await fetch(`https://lrclib.net/api/search?q=${query}`);
    debugLog(response);
    if (!response.ok) throw new Error(`LRCLIB HTTP ${response.status}`);

    const results = await response.json();
    const match = results.find((item) => item.syncedLyrics);
    if (!match) return { success: false, error: "Lirik bertimestamp tidak ditemukan di LRCLIB." };

    let lyrics = match.syncedLyrics;
    debugLog("[LRCLIB] Synced lyrics ditemukan", { lines: lyrics.split(/\r?\n/).length });
    if ([...lyrics].some((char) => /[^\x00-\x7F\s\d\p{P}]/u.test(char))) {
      updateStatus(tabId, "Lirik non-Latin ditemukan. Mengubah ke romaji...");
      lyrics = await transliterateSyncedLyrics(lyrics, info, tabId);
      debugLog("result transliterateSyncedLyrics");
    }
    return { success: true, type: "synced", lyrics };
  } catch (error) {
    debugError("[LRCLIB] Error:", error);
    updateStatus(tabId, `Error LRCLIB: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getLRCLIBByUrl(url, info, tabId) {
  try {
    const match = new URL(url).pathname.match(/^\/tracks\/([1-9]\d*)\/?$/);
    if (!match) return { success: false, error: "URL harus berbentuk https://lrclib.net/tracks/ID." };

    updateStatus(tabId, `Mengambil lirik LRCLIB ID ${match[1]}...`);
    const response = await fetch(`https://lrclib.net/api/get/${match[1]}`);
    if (!response.ok) throw new Error(`LRCLIB HTTP ${response.status}`);

    const record = await response.json();
    if (!record.syncedLyrics) return { success: false, error: "Rekaman LRCLIB ini tidak memiliki lirik bertimestamp." };

    let lyrics = record.syncedLyrics;
    if ([...lyrics].some((char) => /[^\x00-\x7F\s\d\p{P}]/u.test(char))) {
      updateStatus(tabId, "Lirik non-Latin ditemukan. Mengubah ke romaji...");
      lyrics = await transliterateSyncedLyrics(lyrics, info, tabId);
    }
    return { success: true, type: "synced", lyrics, lrclibId: record.id };
  } catch (error) {
    debugError("[LRCLIB] URL error:", error);
    return { success: false, error: error.message };
  }
}

async function transliterateSyncedLyrics(lrc, info, tabId) {
  const lines = lrc.split(/\r?\n/).filter((line) => /^\[\d{2}:\d{2}\.\d{2,3}\]/.test(line));
  const prompt = `Ubah teks lirik berikut menjadi romaji. Pertahankan setiap id. Jangan terjemahkan. Balas JSON valid saja dengan format [{"id":0,"text":"romaji"}]. Jangan pakai markdown atau timestamp. Lagu: ${info.fullName}\n${JSON.stringify(lines.map((line, index) => ({ id: index, text: line.replace(/^.*?\]/, "").trim() })))} `;

  const config = await getAIConfig();
  const providers = [
    ...(config.geminiApiKey ? ["Gemini"] : []),
    ...(config.nineRouterApiKey ? ["9Router"] : [])
  ];
  if (!providers.length) return lrc;

  for (const provider of providers) {
    try {
      updateStatus(tabId, `Transliterasi lirik via ${provider}...`);
      const text = provider === "9Router"
        ? await request9Router(prompt, config)
        : await requestGemini(prompt, config);
      if (!text) continue;
      const translated = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
      debugLog(translated);
      if (!Array.isArray(translated) || translated.length !== lines.length) continue;

      const romajiById = new Map(translated.map((item) => [item?.id, item?.text]));
      if (lines.some((_, index) => typeof romajiById.get(index) !== "string")) continue;

      return lines.map((line, index) => `${line.match(/^.*?\]/)[0]}${romajiById.get(index).trim()}`).join("\n");
    } catch (error) {
      debugError(`[${provider}] Transliteration error:`, error);
    }
  }
  return lrc;
}

async function request9Router(prompt, cfg) {
  const config = cfg || await getAIConfig();
  if (!config.nineRouterApiKey || !config.nineRouterUrl || !config.nineRouterModel) return "";
  const response = await fetch(config.nineRouterUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(config.nineRouterApiKey ? { Authorization: `Bearer ${config.nineRouterApiKey}` } : {}) }, body: JSON.stringify({ model: config.nineRouterModel, messages: [{ role: "user", content: prompt }], stream: false }) });
  if (!response.ok) throw new Error(`9Router HTTP ${response.status}`);
  return (await response.json()).choices?.[0]?.message?.content || "";
}

async function requestGemini(prompt, cfg) {
  const config = cfg || await getAIConfig();
  if (!config.geminiApiKey) return "";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  debugLog("requestGemini");
  debugLog(response);
  if (response.status === 429) {
    debugLog("Gemini quota/rate limit reached; skipping Gemini.");
    return "";
  }
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  return (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function handleLyricsSearch(info, tabId) {
    updateStatus(tabId, `Memulai pencarian untuk: ${info.fullName}`);

    updateStatus(tabId, "1/3: Mencari lirik mentah di Kazelyrics...");
    let rawLyrics = await searchKazelyrics(info.songTitle);
    debugLog("[Alur Lirik] Hasil Kazelyrics:", { rawLyrics });

    const config = await getAIConfig();
    let finalHTML = null;
    if (config.geminiApiKey) {
      updateStatus(tabId, "2/3: Merapikan lirik dengan Gemini...");
      finalHTML = await processWithGemini(info, rawLyrics, tabId);
      debugLog("[Alur Lirik] Hasil Gemini:", { finalHTML });
    }

    if (!finalHTML && config.nineRouterApiKey) {
      updateStatus(tabId, "2/3: Gemini gagal. Mencoba 9Router...");
      finalHTML = await processWith9Router(info, rawLyrics, tabId);
      debugLog("[Alur Lirik] Hasil 9Router:", { finalHTML });
    }

    if (!finalHTML && rawLyrics) {
      updateStatus(tabId, "3/3: Menampilkan lirik mentah...");
      finalHTML = `<div class="lyric-ori" style="white-space: pre-wrap;">${rawLyrics}</div>`;
    } else if (!finalHTML) {
      updateStatus(tabId, "3/3: Pencarian gagal secara keseluruhan.");
    } else {
      updateStatus(tabId, "3/3: Proses selesai! Merender lirik...");
    }

    return finalHTML;
}

async function searchKazelyrics(songTitle) {
  try {
    const searchUrl = `https://www.kazelyrics.com/search?q=${encodeURIComponent(songTitle)}`;

    debugLog(`[Kazelyrics] Mencari di URL: ${searchUrl}`);
    let res = await fetch(searchUrl);
    let html = await res.text();

    let match = html.match(/class=["'][^"']*post-title[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["']/i);

    debugLog(match);

    if (match && match[1]) {
        debugLog(`[Kazelyrics] Ditemukan artikel: ${match[1]}`);
        let postRes = await fetch(match[1]);
        let postHtml = await postRes.text();

        let linkMatch = html.match(/class=["'][^"']*post-title[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["']/i);
        
        if (linkMatch && linkMatch[1]) {
            debugLog(`[Kazelyrics] Ditemukan artikel: ${linkMatch[1]}`);
            let postRes = await fetch(linkMatch[1]);
            let postHtml = await postRes.text();
    
            // Setara dengan: doc.querySelector('.post-body').innerHTML
            // Mencari class "post-body" dan mengambil isinya hingga bertemu penanda akhir khas Blogger (<div style="clear: both")
            let bodyMatch = postHtml.match(/class=["'][^"']*post-body[^"']*["'][^>]*>([\s\S]*?)<div[^>]*class=["'][^"']*post_social_share/i);

            debugLog(bodyMatch);
            
            if (bodyMatch) {
              debugLog("[Kazelyrics] Berhasil mengekstrak HTML lirik.");
              // Kembalikan innerHTML mentah persis seperti aslinya agar Gemini bisa merapikannya
              return bodyMatch[1].trim();
            } else {
              debugLog("[Kazelyrics] Elemen .post-body tidak ditemukan.");
            }
        } else {
            debugLog("[Kazelyrics] Artikel tidak ditemukan.");
        }
    } else {
        debugLog("[Kazelyrics] Artikel tidak ditemukan di halaman pencarian.");
    }
  } catch (e) { 
    debugError("[Kazelyrics] Error scraping:", e); 
  }
  return null;
}

async function processWithGemini(info, rawLyrics, tabId) {
  try {
    let promptText = "";
    if (rawLyrics) {
      promptText = `Teks lirik mentah dari lagu "${info.songTitle}":\n"""\n${rawLyrics}\n"""\nTugasmu HANYA merapikan format teks di atas menggunakan tag HTML: <span class="lyric-ori">, <span class="lyric-romaji">, <span class="lyric-id">. Jangan menambah lirik di luar teks tersebut. Jangan berikan teks pembuka/penutup.`;
    } else {
      promptText = `Berikan lirik lagu untuk lagu berjudul "${info.songTitle}" oleh artis "${info.artist}". Jika tidak tahu, WAJIB jawab "LIRIK_TIDAK_DITEMUKAN". Jika tahu, format WAJIB menggunakan tag HTML: <span class="lyric-ori">, <span class="lyric-romaji">, <span class="lyric-id">. Jangan berikan teks pembuka.`;
    }

    const config = await getAIConfig();
    if (!config.geminiApiKey) return null;
    debugLog("[Gemini AI] Mengirim prompt ke server Google...");
    const text = await requestGemini(promptText, config);
    if (!text || text.includes("LIRIK_TIDAK_DITEMUKAN")) return null;
    debugLog("[Gemini AI] Berhasil menerima respons dari Google.");
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
  } catch (e) {
    debugError("[Gemini AI] Gagal memanggil API:", e);
  }
  return null;
}

async function processWith9Router(info, rawLyrics, tabId) {
  const promptText = rawLyrics
    ? `Rapikan HTML lirik berikut tanpa menambah atau menghapus lirik. Gunakan hanya class lyric-ori, lyric-romaji, lyric-id. Output HTML saja.\n${rawLyrics}`
    : `Cari lirik lagu "${info.songTitle}" oleh "${info.artist}". Jika tidak tahu, jawab LIRIK_TIDAK_DITEMUKAN. Format HTML hanya dengan class lyric-ori, lyric-romaji, lyric-id. Output HTML saja.`;

  try {
    const config = await getAIConfig();
    if (!config.nineRouterApiKey || !config.nineRouterUrl || !config.nineRouterModel) return null;
    const response = await fetch(config.nineRouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.nineRouterApiKey ? { Authorization: `Bearer ${config.nineRouterApiKey}` } : {})
      },
      body: JSON.stringify({
        model: config.nineRouterModel,
        messages: [{ role: "user", content: promptText }],
        stream: false
      })
    });

    if (!response.ok) throw new Error(`9Router HTTP ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text || text.includes("LIRIK_TIDAK_DITEMUKAN")) return null;
    return text.replace(/```html/g, "").replace(/```/g, "").trim();
  } catch (error) {
    debugError("[9Router] Error:", error);
    updateStatus(tabId, `Error 9Router: ${error.message}`);
    return null;
  }
}