# Chrome Web Store Listing Draft

## Extension Name

LRCLIB Lyrics for YouTube

## Short Description

Display synced karaoke lyrics on YouTube with LRCLIB, local caching, and optional AI romaji support.

## Detailed Description

LRCLIB Lyrics for YouTube displays song lyrics in a floating widget while you watch music videos on YouTube.

This is an independent project using the public [LRCLIB API](https://lrclib.net/docs). It is not affiliated with, endorsed by, or maintained by LRCLIB.

### Features

- Synced lyrics from LRCLIB.
- Karaoke highlighting based on video playback time.
- Cross-tab playback synchronization.
- Manual LRCLIB track URL loading.
- `±0.1s` timing offset controls.
- Local lyrics cache and management window.
- Kazelyrics fallback when synced lyrics are unavailable.
- Optional Gemini and 9Router integration for romaji and lyric formatting.
- Works without AI API keys using raw lyrics.

### Privacy

The extension does not require an account and does not include analytics or advertising trackers. Lyrics cache and optional API configuration are stored locally in Chrome. Search requests go directly to LRCLIB, Kazelyrics, and any optional AI provider configured by the user.

See [Privacy Policy](PRIVACY_POLICY.md).

### Credit

Synced lyrics are powered by [LRCLIB — Free & Open Lyrics Library](https://lrclib.net/). Support LRCLIB at [lrclib.net](https://lrclib.net/).

## Category

- Productivity

## Permission Justification

### `activeTab`

Used to interact with the active tab when the user clicks the extension action.

### `scripting`

Declared for extension page interaction and content integration.

### `storage`

Used to store cached lyrics, timing offsets, and optional user-provided AI configuration locally.

### `tabs`

Used to identify the active or audible YouTube tab for cross-tab playback synchronization and lyric lookup.

### Host Permissions

- `https://www.youtube.com/*`: Read the active YouTube video title and playback state.
- `https://lrclib.net/*`: Search and load synced lyrics.
- `https://*.kazelyrics.com/*`: Retrieve fallback lyrics.
- `https://generativelanguage.googleapis.com/*`: Optional Gemini requests.
- `http://localhost:20128/*` and `http://127.0.0.1:20128/*`: Optional local 9Router requests.

## Support

Report bugs or request features through the GitHub repository issue tracker.

## Release Checklist

- [ ] Set `DEBUG = false` in `background.js`.
- [ ] Confirm no API keys exist in source files.
- [ ] Confirm `icons/icon.png` is at least `128×128`.
- [ ] Build ZIP from extension files only.
- [ ] Host `PRIVACY_POLICY.md` at a public HTTPS URL.
- [ ] Add screenshots: `1280×800` or `640×400`.
- [ ] Test install from ZIP in Chrome.
- [ ] Test with no AI keys configured.
- [ ] Test Gemini-only configuration.
- [ ] Test local 9Router configuration.
