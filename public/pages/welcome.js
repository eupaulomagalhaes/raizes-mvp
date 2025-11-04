import { UI } from '../components/ui.js';

export default {
  template(){
    return `
      <main class="hero bg-onboarding">
        <div class="text-center">
          <div class="brand-badge">
            <div class="text-sm tracking-wide text-[var(--text-secondary)]">BOAS VINDAS AO</div>
            <div class="brand-title">Raízes</div>
            <div class="brand-sub">EDUCACIONAL</div>
          </div>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="speech">Eu me chamo DON, e vou te ajudar!</div>
          <div class='flex gap-2'>
            <a class='btn' data-variant='primary' href='#/register'>Começar</a>
          </div>
          <a class='text-sm underline text-[var(--color-primary)]' href='#/login'>Já tenho uma conta!</a>
        </div>
      </main>
    `;
  },
  init(){
    window.mascot.say('Oi! Vamos começar? Você pode entrar ou se cadastrar.');
  }
};
