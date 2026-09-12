# SpotiX 🎵

An extension for the **Spotify Web Player** on Vivaldi (desktop **and** Android) and Chromium browsers: color themes, touch UI scale, pitch-coupled playback speed, forced-highest audio quality, keep-playing-on-lock — **English/Turkish** UI.

## ✨ Features
- 🎨 **Themes**: AMOLED, Classic, Aprel, Night, Neon, Blood, Forest + custom colors
- 📱 **UI scale 100–400%**: enlarge the UI on phones/tablets (desktop-site mode included) — desktop layout is never touched; Spotify Connect, queue and playlists work natively · the enlarged UI **fills the screen exactly** — never pans or overflows (reflows like native browser zoom) · **Scale mode**: Auto / Always on / Off — if detection fails on your device, "Always on" is guaranteed
- 🖼️ **Player**: cover on/off, cover size 24–120 px, player scale 60–300%
- 🐌 **Playback speed 50–150%** — pitch shifts with it (real slowed/nightcore); 100% = full native reset; speed is re-applied after lock/tab events
- 🔊 **Audio quality**: fixed mode — always forces the **highest format your account is allowed** (grayed "Highest (forced)" in UI)
- 🔒 **Keep playing when locked**: inaudible tone + Wake Lock (tested on Nothing OS CMF Phone 1)
- 👆 **Single-click play** (always on) • **Free zoom**: page scaling is never blocked
- 🧹 **Maintenance**: clear Spotify's cache from the popup — with an "Are you sure?" confirmation (a Spotify tab must be open)
- ⚡ **Performance**: background-tab polling paused, heavy blur filters disabled, dead code stripped
- 🖤 **Seamless canvas**: page's bottom backdrop painted in theme color; rounded player corners — no black frame residue
- 🚫 **Ad blocker (BETA)** + banner/"Install" call hiding (always on)

### ⚠️ Audio quality reality (web)
Web player ceilings: **Free ≈128 kbps, Premium ≈256 kbps** (320 is not served on web). "Forced highest" requests the top of what your account is allowed — no extension can exceed the server quota.

### 💡 Adblocker tip
SpotiX's ad blocker is **BETA**. For best results also run **uBlock Origin Lite** or **AdGuard** and fine-tune their filter lists for Spotify — that combination is far more effective. They coexist fine.

## 📦 Install (Vivaldi — desktop & Android)
1. Download/clone the repo → `SpotiX` folder
2. `vivaldi://extensions` → enable **Developer mode** → **Load unpacked** → pick `SpotiX`
3. Refresh the `open.spotify.com` tab

**Update**: overwrite the folder → ↻ in `vivaldi://extensions` → refresh the tab. Settings persist (chrome.storage.sync).

## 🔒 Privacy
Nothing is collected or sent anywhere. Settings live in your browser's sync storage.

## 📄 License — MIT
