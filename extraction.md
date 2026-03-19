# Contrarian

## project name + description
- contrarian: Chrome extension that replaces new tab with a single Paul Graham quote — one thought per tab, no feed, no noise

## who it's for
- Anyone who reads PG essays; thoughtful browsers who want a minimal, idea-first new tab

## current status
- shipped — v1.0.0, pending Chrome Web Store submission

## what was actually built
- 125 quotes corpus: 98 PG essays + 27 quotes from PG-curated thinkers (Feynman, Churchill, Perlis, Knuth)
- Daily seeded shuffle using `Math.floor(Date.now() / 86400000)` as seed — consistent per day, rotates daily, no server needed
- Keyboard shortcuts: Space/→ next, ← prev, O open essay, F save to favourites, L open sidebar, Esc close
- Favourites sidebar with markdown export
- Swipe support (mobile left/right)
- 2-step onboarding walkthrough (shown once on install, never again)
- Static JSON corpus bundled with extension — no backend, no API, no tracking
- Chrome Storage API for favourites and onboarding state persistence
- Source links back to paulgraham.com for every quote

## why it was built
- To create a minimal new tab that surfaces ideas instead of feeds; a personal tool that the builder also wants to email to Paul Graham directly

## blockers or reasons shelved
- n/a — not shelved; pending Chrome Web Store submission
- Only 98 of 226 PG essays processed into the corpus (128 essays remaining)

## wins or progress moments
- Zero dependencies, zero build step — entire extension is manifest.json + newtab.html/js/css + quotes.json
- Seeded shuffle algorithm means same-day experience is consistent across installs without any server
- Dark dot-grid design that makes the quote the only thing on the page

## pain points
- Manual process to extract quotes from 226 PG essays — only 98 done so far
- Balancing quote length: some PG lines need context to land, others work standalone

## where claude api / ai was used or planned
- No AI API used; static corpus only

## what would've helped
- Automated quote extraction from paulgraham.com essays (LLM pipeline to extract best lines per essay)
- Chrome Web Store developer account

## metrics or traction
- none yet — not submitted to Chrome Web Store
