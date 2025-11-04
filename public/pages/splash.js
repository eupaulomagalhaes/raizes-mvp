import { UI } from '../components/ui.js';

export default {
  template(){
    return `
      <main class="space-y-6" aria-label="Splash">
        <div class="text-center space-y-4">
          <h1 class="h1">Raízes</h1>
          <p class="text-[var(--text-secondary)]">Jogos cognitivos para crianças</p>
        </div>
        ${UI.Card(`
          <div class='space-y-3'>
            <div class='h3'>Carregando...</div>
            ${UI.ProgressBar(25, 'id="splash-progress"')}
          </div>
        `)}
      </main>
    `;
  },
  init(){
    const bar = document.querySelector('#splash-progress .bar');
    let p = 25;
    const iv = setInterval(()=>{ p+=25; bar.style.width = p+'%'; if (p>=100){ clearInterval(iv); location.hash = '#/welcome'; } }, 250);
  }
};
