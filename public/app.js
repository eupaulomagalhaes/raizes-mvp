import { initRouter, navigate } from './router.js';
import { enableA11y } from './utils/accessibility.js';
import { MascotBubble } from './components/mascot.js';
import { supabase } from './supabase.js';

// PWA: registrar SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

// Acessibilidade base
enableA11y();

// Mascote global
window.mascot = new MascotBubble({
  container: document.body,
  avatar: 'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/w98ashcp30yj/cabeca.png',
});

// Inicializa roteador
initRouter();

// Expor navegação para links programáticos
window.appNavigate = navigate;

// Exemplo de sessão persistida
supabase.init();
