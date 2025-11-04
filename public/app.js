import { initRouter, navigate } from './router.js';
import { enableA11y } from './utils/accessibility.js';
import { supabase } from './supabase.js';

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
