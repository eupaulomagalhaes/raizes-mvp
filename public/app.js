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

function ensureBgm(){
  if (bgmEl) return bgmEl;
  bgmEl = document.createElement('audio');
  bgmEl.src = BGM_URL;
  bgmEl.loop = true;
  bgmEl.preload = 'auto';
  bgmEl.volume = 0.45;
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

// Iniciar BGM após Splash
window.addEventListener('hashchange', ()=>{
  try{
    if (location.hash === '#/welcome' && localStorage.getItem('bgm_pending') === '1'){
      localStorage.removeItem('bgm_pending');
      tryPlayBgm();
    }
  }catch{}
});

// Caso a rota inicial já seja welcome com flag pendente
try{
  if (location.hash === '#/welcome' && localStorage.getItem('bgm_pending') === '1'){
    localStorage.removeItem('bgm_pending');
    tryPlayBgm();
  }
}catch{}
