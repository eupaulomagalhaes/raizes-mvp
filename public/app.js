import { initRouter, navigate } from './router.js';
import { enableA11y } from './utils/accessibility.js';
import { supabase } from './supabase.js';

// Background Music (BGM)
const BGM_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/audios/sound_trakcs/difacil_audio_track_voiceless.mp3';
let bgmEl;
function ensureBgm(){
  if (bgmEl) return bgmEl;
  bgmEl = document.createElement('audio');
  bgmEl.src = BGM_URL;
  bgmEl.loop = true;
  bgmEl.preload = 'auto';
  bgmEl.volume = 0.45;
  bgmEl.setAttribute('aria-hidden','true');
  bgmEl.style.display = 'none';
  document.body.appendChild(bgmEl);
  return bgmEl;
}
async function tryPlayBgm(){
  const el = ensureBgm();
  try{
    await el.play();
  }catch{
    // Autoplay bloqueado: esperar primeira interação
    const onInteract = async ()=>{
      try{ await el.play(); }catch{}
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once:true });
    window.addEventListener('keydown', onInteract, { once:true });
  }
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
