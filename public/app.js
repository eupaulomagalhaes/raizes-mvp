import { initRouter, navigate } from './router.js';
import { enableA11y } from './utils/accessibility.js';
import { supabase } from './supabase.js';

// Background Music (BGM)
const BGM_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/audios/sound_trakcs/difacil_audio_track_voiceless.mp3';
const BGM_STATE_KEY = 'bgm_enabled';
const BGM_PENDING_KEY = 'bgm_pending';
let bgmEl;
let bgmDesired = true;
let unlockPending = false;
let bgmToggleEl = null;
let bgmToggleIcon = null;
let bgmChangeListenerAttached = false;

try{
  const stored = localStorage.getItem(BGM_STATE_KEY);
  if (stored === null) localStorage.setItem(BGM_STATE_KEY, '1');
  else bgmDesired = stored === '1';
}catch{}

function emitBgmChange(){
  const detail = {
    enabled: bgmDesired,
    playing: !!(bgmEl && !bgmEl.paused && bgmEl.currentTime > 0)
  };
  document.dispatchEvent(new CustomEvent('bgm:change', { detail }));
}

function renderBgmToggle(enabled, playing){
  if (!bgmToggleEl && !ensureBgmToggle()) return;
  const isEnabled = typeof enabled === 'boolean' ? enabled : bgmDesired;
  const isPlaying = typeof playing === 'boolean' ? playing : !!(bgmEl && !bgmEl.paused && bgmEl.currentTime > 0);
  bgmToggleEl.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
  bgmToggleEl.setAttribute('data-playing', isPlaying ? 'true' : 'false');
  if (bgmToggleIcon) bgmToggleIcon.textContent = isEnabled && isPlaying ? '🔊' : '🔇';
}

function ensureBgmToggle(){
  if (bgmToggleEl) return bgmToggleEl;
  if (!document.body){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', ensureBgmToggle, { once:true });
    }
    return null;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bgm-toggle';
  btn.setAttribute('aria-label', 'Alternar música');
  btn.setAttribute('aria-pressed', 'true');
  btn.dataset.role = 'bgm-toggle';

  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '♪';
  btn.appendChild(icon);

  btn.addEventListener('click', ()=>{
    const enabled = toggleBgm();
    renderBgmToggle(enabled, !!(bgmEl && !bgmEl.paused && bgmEl.currentTime > 0));
  });

  document.body.appendChild(btn);
  bgmToggleEl = btn;
  bgmToggleIcon = icon;
  renderBgmToggle();

  if (!bgmChangeListenerAttached){
    document.addEventListener('bgm:change', (event)=>{
      const detail = event.detail || {};
      renderBgmToggle(detail.enabled, detail.playing);
    });
    bgmChangeListenerAttached = true;
  }

  return btn;
}

function ensureBgm(){
  if (bgmEl) return bgmEl;
  bgmEl = document.createElement('audio');
  bgmEl.src = BGM_URL;
  bgmEl.loop = true;
  bgmEl.preload = 'auto';
  bgmEl.volume = 0.15; // Volume mais suave
  bgmEl.setAttribute('aria-hidden','true');
  bgmEl.style.display = 'none';
  bgmEl.addEventListener('play', emitBgmChange);
  bgmEl.addEventListener('pause', emitBgmChange);
  document.body.appendChild(bgmEl);
  return bgmEl;
}

function queueAutoplayUnlock(){
  if (unlockPending) return;
  unlockPending = true;
  const handler = async ()=>{
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
    unlockPending = false;
    if (!bgmDesired) return;
    const el = ensureBgm();
    try{ await el.play(); }catch{}
    emitBgmChange();
  };
  window.addEventListener('pointerdown', handler, { once:true });
  window.addEventListener('keydown', handler, { once:true });
}

async function tryPlayBgm(){
  if (!bgmDesired) return;
  const el = ensureBgm();
  try{
    await el.play();
    emitBgmChange();
  }catch{
    queueAutoplayUnlock();
  }
}

function pauseBgm(){
  if (!bgmEl) return;
  bgmEl.pause();
  emitBgmChange();
}

function setBgmEnabled(enabled){
  bgmDesired = enabled;
  try{ localStorage.setItem(BGM_STATE_KEY, enabled ? '1' : '0'); }catch{}
  if (enabled) tryPlayBgm();
  else pauseBgm();
  emitBgmChange();
}

function toggleBgm(){
  setBgmEnabled(!bgmDesired);
  return bgmDesired;
}

window.bgmController = {
  setEnabled: setBgmEnabled,
  toggle: toggleBgm,
  isEnabled: () => bgmDesired,
  isPlaying: () => !!(bgmEl && !bgmEl.paused && bgmEl.currentTime > 0)
};

// Navbar inferior global
let navbarEl = null;
const NAVBAR_ROUTES = ['#/games', '#/children', '#/settings'];
const NAVBAR_HIDDEN_ROUTES = ['#/', '#/welcome', '#/login', '#/register'];

function ensureNavbar(){
  if (navbarEl) return navbarEl;
  if (!document.body) return null;

  const nav = document.createElement('nav');
  nav.className = 'bottom-navbar';
  nav.setAttribute('aria-label', 'Navegação principal');
  nav.innerHTML = `
    <a href="#/games" class="nav-item" data-route="#/games">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="8" cy="12" r="2"/>
        <path d="M14 10h4M16 8v4"/>
      </svg>
      <span>Jogos</span>
    </a>
    <a href="#/children" class="nav-item" data-route="#/children">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      </svg>
      <span>Crianças</span>
    </a>
    <a href="#/settings" class="nav-item" data-route="#/settings">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
      <span>Config</span>
    </a>
  `;
  document.body.appendChild(nav);
  navbarEl = nav;
  updateNavbarActive();
  return nav;
}

function updateNavbarActive(){
  if (!navbarEl) return;
  const current = location.hash || '#/';
  navbarEl.querySelectorAll('.nav-item').forEach(item => {
    const route = item.dataset.route;
    item.classList.toggle('active', current.startsWith(route));
  });
}

function updateNavbarVisibility(){
  if (!navbarEl) ensureNavbar();
  if (!navbarEl) return;
  const current = location.hash || '#/';
  const shouldHide = NAVBAR_HIDDEN_ROUTES.some(r => current === r || current.startsWith(r + '/'));
  navbarEl.style.display = shouldHide ? 'none' : 'flex';
  updateNavbarActive();
}

// PWA: registrar SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

// Acessibilidade base
enableA11y();

// Inicializa roteador
initRouter();

// Expor navegação para links programáticos
window.appNavigate = navigate;

// Exemplo de sessão persistida
supabase.init();

// Iniciar BGM após Splash e atualizar navbar
window.addEventListener('hashchange', ()=>{
  try{
    if (location.hash === '#/welcome' && localStorage.getItem('bgm_pending') === '1'){
      localStorage.removeItem('bgm_pending');
      tryPlayBgm();
    }
  }catch{}
  updateNavbarVisibility();
});

// Inicializar navbar
ensureNavbar();
updateNavbarVisibility();

// Caso a rota inicial já seja welcome com flag pendente
try{
  if (location.hash === '#/welcome' && localStorage.getItem('bgm_pending') === '1'){
    localStorage.removeItem('bgm_pending');
    tryPlayBgm();
  }
}catch{}
