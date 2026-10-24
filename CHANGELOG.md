# Changelog

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi rilis sumber utama ada di `manifest.json`.

## [2.5.3] - 2026-10-24

### Added
- Key penyimpanan lirik berdasarkan ID video YouTube, dengan migrasi cache lama berbasis artis dan judul.
- Pilihan sumber info video: DOM YouTube (default), YouTube Data API, atau proxy.
- Opsi konfigurasi YouTube Data API key untuk pengambilan metadata video.

### Changed
- Pertahankan judul video raw untuk metadata dan tampilan; bersihkan query secara terpisah untuk pencarian lirik.
- Perbarui ekspor/impor pack agar mendukung ID video dan tetap kompatibel dengan schema lama.
- Tingkatkan UI/UX konfigurasi dan informasi penggunaan.

## [2.5.2] - 2026-10-22

### Added
- Tampilan lirik asli.

### Changed
- Penyesuaian UI dan manajemen lirik.

## [2.5.1] - 2026-10-21

### Added
- Ekspor lirik tersimpan ke file JSON, termasuk terjemahan dan metadata lagu.
- Impor file JSON dengan validasi dan merge yang melewati lagu duplikat.
- Pemuatan pack lirik komunitas dari GitHub Releases.

## [2.5] - 2026-10-20

### Added
- Terjemahan lirik sinkron per baris dengan pilihan bahasa Indonesia atau English.
- Tab Changelog di halaman manajemen.

### Changed
- UI/UX widget lirik: lebar lebih lega dan tombol aksi dapat membungkus.
- UI/UX halaman manajemen: pisahkan lirik tersimpan, konfigurasi, informasi, dan changelog ke tab berbeda.
- Accordion konfigurasi tampil dalam dua kolom pada layar lebar.

## [2.4] - 2026-10-19 — Initial release

### Added
- Rilis awal ekstensi LRCLIB Lyrics for YouTube.
- Widget lirik karaoke YouTube dengan sumber lirik bertimestamp dari LRCLIB.
- Penyimpanan lirik lokal, pengaturan offset sinkronisasi, dan halaman manajemen data.
