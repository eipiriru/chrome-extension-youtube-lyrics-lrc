# YouTube Lyrics from LRCLIB

Chrome extension untuk menampilkan lirik YouTube dalam widget mengambang.

> **Independent project.** This extension uses the public LRCLIB API and is not affiliated with, endorsed by, or maintained by LRCLIB.

## Kredit LRCLIB

Fungsi inti lirik sinkron ekstensi ini bergantung pada data dan API dari [LRCLIB — Free & Open Lyrics Library](https://lrclib.net/).

- Situs: [lrclib.net](https://lrclib.net/)
- Dokumentasi API: [lrclib.net/docs](https://lrclib.net/docs)
- Source code LRCLIB: [github.com/tranxuanthang/lrclib](https://github.com/tranxuanthang/lrclib)
- Dukungan LRCLIB: [lrclib.net](https://lrclib.net/)

## Fitur

- Cari lirik bertimestamp dari [LRCLIB](https://lrclib.net/).
- Mode karaoke: baris aktif tersorot mengikuti waktu video.
- Sinkronisasi waktu lintas tab: tab YouTube yang bersuara menjadi sumber waktu.
- Muat lirik langsung dari URL `https://lrclib.net/tracks/ID`.
- Atur offset sinkronisasi `±0.1s` dan reset ke sumber asli.
- Cache lirik lokal dan halaman manajemen cache.
- Fallback lirik mentah dari Kazelyrics bila LRCLIB tidak memiliki lirik sinkron.
- Gemini dan 9Router opsional untuk romaji serta perapian lirik.
- API key disimpan hanya di `chrome.storage.local` browser.

## Instalasi untuk Development

1. Clone repository ini.
2. Buka `chrome://extensions` di Chrome.
3. Aktifkan **Developer mode**.
4. Klik **Load unpacked**.
5. Pilih folder root repository ini.
6. Buka video YouTube lalu klik ikon ekstensi.

## Cara Pakai

1. Putar video musik YouTube.
2. Klik ikon ekstensi untuk membuka atau menutup widget lirik.
3. Widget mencoba lirik sinkron dari LRCLIB terlebih dahulu.
4. Jika lirik sinkron tidak tersedia, widget mencari lirik biasa dari Kazelyrics.
5. Gunakan tombol `−0.1s` atau `+0.1s` untuk mengatur ketepatan karaoke.
6. Gunakan tombol `🔗` untuk memuat URL track LRCLIB jika hasil pencarian salah.
7. Klik `⚙️` untuk mengelola cache lirik dan konfigurasi AI.

## Request Lagu

Lagu yang belum ada di lyrics pack bisa diajukan melalui [form request lagu](https://forms.gle/gs9XVFNYfWBvZGyZ8).

## Konfigurasi AI Opsional

Ekstensi tetap berfungsi tanpa konfigurasi AI:

- LRCLIB dipakai apa adanya.
- Kazelyrics ditampilkan sebagai lirik mentah.

Untuk romaji atau perapian lirik, buka `⚙️` lalu isi salah satu atau kedua provider berikut:

### Gemini

1. Buat API key di [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Isi field **Gemini API Key**.
3. Klik **Simpan Konfigurasi**.

### 9Router lokal

Isi seluruh field 9Router:

- **Base URL Chat Completions**: `http://localhost:20128/v1/chat/completions`
- **API Key**: key dari instance 9Router Anda, jika diperlukan.
- **Model**: nama model yang tersedia pada instance Anda, misalnya `gemini-flash`.

`9Router` tidak dipanggil jika URL, key, atau model kosong.

## Data dan Privasi

- Baca [Privacy Policy](PRIVACY_POLICY.md).
- API key dan cache lirik disimpan lokal di profil Chrome Anda.
- API key tidak dikirim ke repository ini.

## Development

Untuk log development, ubah nilai ini di `background.js`:

```js
const DEBUG = true;
```

Sebelum rilis, kembalikan ke:

```js
const DEBUG = false;
```

## Lisensi

[MIT](LICENSE)
