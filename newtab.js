// Contrarian — newtab.js

const STORAGE_KEY_INDEX = 'contrarian_index';
const STORAGE_KEY_FAVS  = 'contrarian_favs';
const STORAGE_KEY_OB    = 'contrarian_onboarded';

// ── Load corpus ───────────────────────────────────────────────────────────────
let quotes = [];
let currentIndex = 0;
let favourites   = [];
let sidebarOpen  = false;

async function init() {
  // Fetch quotes corpus
  const res = await fetch(chrome.runtime.getURL('quotes.json'));
  const raw = await res.json();
  // Dedup by exact text match
  const seen = new Set();
  quotes = raw.filter(q => { if (seen.has(q.text)) return false; seen.add(q.text); return true; });

  // Shuffle once per session using date seed so everyone sees same order per day
  const seed = Math.floor(Date.now() / 86400000);
  quotes = seededShuffle(quotes, seed);

  // Restore index and favourites from storage
  const stored = await chrome.storage.local.get([STORAGE_KEY_INDEX, STORAGE_KEY_FAVS, STORAGE_KEY_OB]);
  const savedIndex = stored[STORAGE_KEY_INDEX] ?? 0;
  favourites = stored[STORAGE_KEY_FAVS] ?? [];

  // Every page load (new tab or refresh) advances to the next quote
  currentIndex = (savedIndex + 1) % quotes.length;
  save();

  render();
  renderSidebar();

  // Show onboarding on first install
  if (!stored[STORAGE_KEY_OB]) {
    document.getElementById('onboarding').classList.remove('hidden');
  }
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function dismissOnboarding() {
  const ob = document.getElementById('onboarding');
  ob.classList.add('fade-out');
  ob.addEventListener('animationend', () => ob.classList.add('hidden'), { once: true });
  chrome.storage.local.set({ [STORAGE_KEY_OB]: true });
}

document.getElementById('ob-next-1').addEventListener('click', () => {
  document.getElementById('ob-step-1').classList.add('hidden');
  document.getElementById('ob-step-2').classList.remove('hidden');
});

document.getElementById('ob-back-2').addEventListener('click', () => {
  document.getElementById('ob-step-2').classList.add('hidden');
  document.getElementById('ob-step-1').classList.remove('hidden');
});

document.getElementById('ob-start').addEventListener('click', dismissOnboarding);

// ── Seeded shuffle (Fisher-Yates with simple LCG) ─────────────────────────────
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Render current quote ──────────────────────────────────────────────────────
function render(direction = null) {
  const q    = quotes[currentIndex];
  const wrap = document.getElementById('quote-wrap');
  const text = document.getElementById('quote-text');
  const auth = document.getElementById('quote-author');
  const src  = document.getElementById('quote-source');

  // Exit animation
  if (direction) {
    wrap.classList.add('exit');
    wrap.addEventListener('animationend', () => {
      wrap.classList.remove('exit');
      wrap.style.opacity = '0';
      setQuote(q, wrap, text, auth, src);
    }, { once: true });
  } else {
    setQuote(q, wrap, text, auth, src);
  }

}

function setQuote(q, wrap, text, auth, src) {
  const link = document.getElementById('quote-link');
  link.textContent = q.text;
  link.href = q.url || '#';
  link.style.pointerEvents = q.url ? 'auto' : 'none';
  auth.textContent = q.author || 'Paul Graham';
  const srcText = (q.source && q.source !== 'curated') ? q.source : '';
  src.textContent = srcText;
  if (q.url) {
    src.href = q.url;
    src.style.pointerEvents = 'auto';
  } else {
    src.removeAttribute('href');
    src.style.pointerEvents = 'none';
  }
  const dot = document.getElementById('quote-dot');
  if (dot) dot.classList.toggle('hidden', !srcText);

  // Dynamic font size based on quote length
  const len = q.text.length;
  let size;
  if      (len < 80)  size = '2.8rem';
  else if (len < 140) size = '2.2rem';
  else if (len < 220) size = '1.75rem';
  else if (len < 320) size = '1.45rem';
  else                size = '1.2rem';
  text.style.fontSize = size;

  // Sync fav button with displayed quote
  const isFav = favourites.some(f => f.text === q.text);
  document.getElementById('btn-fav').classList.toggle('active', isFav);
  document.getElementById('btn-fav').textContent = isFav ? '♥' : '♡';

  // Counter: 042 / 125
  const counter = document.getElementById('quote-counter');
  if (counter) counter.textContent = `${String(currentIndex + 1).padStart(3, '0')} / ${quotes.length}`;


  // Restart breathing animation
  wrap.classList.remove('breathing');
  void wrap.offsetWidth; // reflow
  wrap.classList.add('breathing');
  wrap.style.opacity = '';
}

// ── Navigate ──────────────────────────────────────────────────────────────────
function goNext() {
  currentIndex = (currentIndex + 1) % quotes.length;
  save();
  render('next');
}

function goPrev() {
  currentIndex = (currentIndex - 1 + quotes.length) % quotes.length;
  save();
  render('prev');
}

function save() {
  chrome.storage.local.set({ [STORAGE_KEY_INDEX]: currentIndex });
}

// ── Favourites ────────────────────────────────────────────────────────────────
function toggleFav() {
  const q = quotes[currentIndex];
  const idx = favourites.findIndex(f => f.text === q.text);
  if (idx >= 0) {
    favourites.splice(idx, 1);
    showToast('removed');
  } else {
    favourites.unshift({ text: q.text, author: q.author, source: q.source });
    showToast('saved to favourites');
  }
  chrome.storage.local.set({ [STORAGE_KEY_FAVS]: favourites });
  render();
  renderSidebar();
}

function renderSidebar() {
  const items = document.getElementById('sidebar-items');
  const empty = document.getElementById('sidebar-empty');

  items.innerHTML = '';
  if (favourites.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  for (const q of favourites) {
    // Look up URL from live corpus in case saved copy predates URL field
    const live = quotes.find(x => x.text === q.text);
    const url  = q.url || live?.url || null;

    const div = document.createElement('div');
    div.className = 'sidebar-item';
    div.innerHTML = `
      <div class="sidebar-item-text">${escHtml(q.text)}</div>
      <div class="sidebar-item-footer">
        <span class="sidebar-item-meta">${escHtml(q.author)}${q.source && q.source !== 'curated' ? ' · ' + escHtml(q.source) : ''}</span>
        ${url ? `<a class="sidebar-item-link" href="${url}" target="_blank" rel="noopener">↗</a>` : ''}
      </div>
    `;
    div.addEventListener('click', e => {
      if (e.target.closest('.sidebar-item-link')) return;
      const i = quotes.findIndex(x => x.text === q.text);
      if (i >= 0) { currentIndex = i; save(); render(); }
      closeSidebar();
    });
    items.appendChild(div);
  }
}

function openSidebar() {
  sidebarOpen = true;
  document.getElementById('fav-sidebar').classList.remove('hidden');
  document.getElementById('btn-list').classList.add('active');
}

function closeSidebar() {
  sidebarOpen = false;
  document.getElementById('fav-sidebar').classList.add('hidden');
  document.getElementById('btn-list').classList.remove('active');
}

// ── Export markdown ───────────────────────────────────────────────────────────
function exportMarkdown() {
  const lines = ['# Contrarian — Favourites\n'];
  for (const q of favourites) {
    lines.push(`> ${q.text}`);
    lines.push(`>\n> — ${q.author}${q.source && q.source !== 'curated' ? ', *' + q.source + '*' : ''}\n`);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contrarian-favourites.md';
  a.click();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('fav-toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key;

  if (key === 'ArrowRight' || key === ' ') { e.preventDefault(); goNext(); }
  if (key === 'ArrowLeft')                  { e.preventDefault(); goPrev(); }
  if (key === 'f' || key === 'F')           toggleFav();
  if (key === 'l' || key === 'L')           sidebarOpen ? closeSidebar() : openSidebar();
  if (key === 'o' || key === 'O')           { const u = quotes[currentIndex]?.url; if (u) window.open(u, '_blank'); }
  if (key === 'Escape')                     { if (sidebarOpen) closeSidebar(); }
});

// ── Button wiring ─────────────────────────────────────────────────────────────
document.getElementById('btn-fav').addEventListener('click', toggleFav);
document.getElementById('btn-list').addEventListener('click', () => sidebarOpen ? closeSidebar() : openSidebar());
document.getElementById('btn-close-sidebar').addEventListener('click', closeSidebar);
document.getElementById('btn-export').addEventListener('click', exportMarkdown);

// Click outside sidebar to close
document.getElementById('app').addEventListener('click', () => { if (sidebarOpen) closeSidebar(); });

// ── Swipe (mobile) ────────────────────────────────────────────────────────────
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 50) return; // minimum swipe distance
  dx < 0 ? goNext() : goPrev();
}, { passive: true });

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
