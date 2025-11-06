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
          <div class="mt-3">${UI.ProgressBar(0, 'id="splash-progress"')}</div>
        </div>
      </main>
    `;
  },
  init(){
    const container = document.getElementById('splash-progress');
    if (container) container.classList.add('auto');
    const bar = container?.querySelector('.bar');
    if (bar){
      bar.addEventListener('animationend', ()=>{
        try { localStorage.setItem('bgm_pending','1'); } catch(e){}
        location.hash = '#/welcome';
      }, { once:true });
    } else {
      setTimeout(()=>{ try { localStorage.setItem('bgm_pending','1'); } catch(e){}; location.hash='#/welcome'; }, 3000);
    }
  }
};
