import { UI } from '../components/ui.js';

export default {
  template(){
    return `
      <main class="splash-wrap bg-onboarding" aria-label="Splash">
        <div class="splash-don">
          <img src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/5m2imr90fuaf/inteiro.png" alt="DON"/>
        </div>
        <div class="splash-bottom">
          <div class="splash-title">Bem Vindo.</div>
          <div class="mt-3">${UI.ProgressBar(15, 'id="splash-progress"')}</div>
        </div>
      </main>
    `;
  },
  init(){
    const bar = document.querySelector('#splash-progress .bar');
    let p = 15;
    const iv = setInterval(()=>{ p+=25; bar.style.width = p+'%'; if (p>=100){ clearInterval(iv); location.hash = '#/welcome'; } }, 200);
  }
};
