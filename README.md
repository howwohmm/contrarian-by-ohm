# Contrarian

Words worth sitting with.

Contrarian is a Chrome extension that replaces your new tab with a single idea — drawn from Paul Graham's essays and the minds he reads. One quote per tab. No feed. No noise. Just a thought and where it came from.

---

## The corpus

125 quotes from two sources:

- **Paul Graham's essays** — lines extracted from his published writing, linked directly to the source essay on paulgraham.com
- **PG's curated collection** — quotes he gathered from others on his [quotes page](http://www.paulgraham.com/quo.html): Feynman, Churchill, Perlis, Knuth, and more

Every quote links back to its source. Click the essay title or press `O` to read the full thing.

---

## Features

| Key | Action |
|-----|--------|
| `Space` or `→` | Next quote |
| `←` | Previous quote |
| `O` | Open the source essay |
| `F` | Save to favourites |
| `L` | Open favourites sidebar |
| `Esc` | Close sidebar |

- **Swipe** left/right on mobile
- **Favourites sidebar** — save quotes, jump back to them, export as markdown
- **Daily shuffle** — seeded by date, so the order is consistent per day and different tomorrow
- **First-time onboarding** — two-step walkthrough on install, never shown again

---

## Design

Dark background. Dot grid. System sans-serif. No serifs, no gradients, no decoration — just the words and the accent.

The interface disappears. The quote stays.

---

## Stack

Zero dependencies. No React, no build step, no bundler.

```
manifest.json        → Chrome Extension Manifest V3
newtab.html          → New tab page shell
newtab.js            → All UI logic
newtab.css           → All styles (dot grid, animations, sidebar)
quotes.json          → Static corpus — 125 quotes with author, source, and URL
icons/               → Extension icons (16, 48, 128px)
generate-icons.html  → Canvas-based icon generator utility
```

**Key decisions:**

- **Static JSON corpus** — no backend, no API, no tracking. The quotes are bundled with the extension and never leave the browser.
- **Seeded shuffle** — `Math.floor(Date.now() / 86400000)` as seed ensures everyone on the same day sees the same order, and it rotates daily without any server.
- **Chrome Storage API** — favourites and onboarding state persist via `chrome.storage.local`.
- **No framework** — vanilla DOM, single JS file, custom CSS animations.

---

## Install

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this directory
5. Open a new tab

---

## Credits

Built by [ohm.](https://x.com/ohmdreams)
