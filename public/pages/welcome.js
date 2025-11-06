import { UI } from '../components/ui.js';

export default {
  template(){
    return `
      <main class="welcome-wrap bg-onboarding">
        <button class="bgm-toggle" type="button" aria-pressed="true" aria-label="Alternar música" data-role="bgm-toggle">
          <span class="icon" aria-hidden="true">♪</span>
        </button>
        <div class="welcome-top">
          <div class="pre">BEM-VINDO AO</div>
          <div class="badge">
            <div class="title">Raízes</div>
            <div class="sub">EDUCACIONAL</div>
          </div>
        </div>

        <section class="welcome-bottom">
          <div class="welcome-don">
            <img src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/5m2imr90fuaf/inteiro.png" alt="DON" />
          </div>
          <div class="welcome-right">
            <div class="welcome-bubble"><div class="speech">Eu me chamo DON, e vou te ajudar!</div></div>
            <div class="cta-area">
              <a class='btn' data-variant='primary' href='#/register'>Começar</a>
              <a class='cta-link' href='#/login'>Já tenho uma conta!</a>
            </div>
          </div>
        </section>
      </main>
    `;
  },
  init(){
    const button = document.querySelector('[data-role="bgm-toggle"]');
    const icon = button?.querySelector('.icon');
    const controller = window.bgmController;

    if (!button || !controller){
      if (button) button.style.display = 'none';
      return;
    }

    const renderState = (enabled, playing)=>{
      const isEnabled = typeof enabled === 'boolean' ? enabled : controller.isEnabled();
      const isPlaying = typeof playing === 'boolean' ? playing : controller.isPlaying();
      button.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
      button.setAttribute('data-playing', isPlaying ? 'true' : 'false');
      if (icon) icon.textContent = isEnabled && isPlaying ? '🔊' : '🔇';
    };

    button.addEventListener('click', ()=>{
      const enabled = controller.toggle();
      renderState(enabled, controller.isPlaying());
    });

    const onChange = (event)=>{
      const detail = event.detail || {};
      renderState(detail.enabled, detail.playing);
    };
    document.addEventListener('bgm:change', onChange);

    renderState();
  }
};
