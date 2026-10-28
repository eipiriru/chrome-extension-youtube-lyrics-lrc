# Privacy Policy

Last updated: October 19, 2026

## Overview

LRCLIB Lyrics for YouTube is a browser extension that displays song lyrics while you watch music videos on YouTube.

This is an independent project that uses LRCLIB's public API. It is not affiliated with, endorsed by, or maintained by LRCLIB.

We do not operate backend user accounts, analytics trackers, advertising networks, or remote telemetry servers for this extension.

## Data We Process

### 1. YouTube Page Context
The extension inspects the title, channel name, and current playback time of the active YouTube tab to search for corresponding lyrics and synchronize karaoke highlighting. This data is processed locally in your browser.

### 2. Lyrics Search Requests
- **LRCLIB**: When searching for synced lyrics, the extension sends the artist and song title to `https://lrclib.net/api/search`. When you load a track URL manually, it queries `https://lrclib.net/api/get/{id}`.
- **Kazelyrics**: If no synced lyrics are found, the extension queries `https://www.kazelyrics.com/` for fallback text.

These requests are direct connections between your browser and the respective third-party service.

### 3. Optional AI Services
If you choose to configure optional API keys:
- **Google Gemini**: Prompts containing song lyrics are sent directly from your browser to Google Generative Language API (`https://generativelanguage.googleapis.com/`) to transliterate non-Latin lyrics into romaji or format plain lyrics.
- **9Router / Custom OpenAI-compatible endpoint**: Prompts are sent directly from your browser to the URL you specify (such as a local `http://localhost:20128/` endpoint or remote endpoint).

If no keys or URLs are provided, the extension bypasses all AI calls and only uses raw lyrics.

### 4. Local Storage
The extension uses `chrome.storage.local` to store:
- Cached lyrics and timing offsets so previously played songs do not require repeated network lookups.
- Your optional AI configuration (Gemini API key, 9Router URL, 9Router key, and model name).

This data never leaves your local browser profile through our extension. We do not sync it to any third-party server owned by us.

## Data Retention and Deletion

You can clear cached lyrics or reset your AI configuration at any time from the extension's Management window (`⚙️` icon). Uninstalling the extension removes all data stored by `chrome.storage.local`.

## Changes to This Policy

If functionality changes in a way that affects data handling, this policy will be updated in the extension repository.

## Contact

For questions or bug reports, open an issue in the [GitHub repository](https://github.com/eipiriru/chrome-extension-youtube-lyrics-lrc/).

The extension includes an optional external link to [Trakteer](https://trakteer.id/ainurkz) for voluntary development support. The extension does not process payments or track link clicks; Trakteer's own privacy policy applies if you visit or use its service.
