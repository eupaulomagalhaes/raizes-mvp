import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class="login-screen bg-onboarding">
        <div class="login-content">
          <div class="login-greeting">OLÁ DE NOVO!</div>
          <div class="login-card">
            <div class="login-card-brand">
              <div class="login-brand-main">Raízes</div>
              <div class="login-brand-sub">EDUCACIONAL</div>
            </div>
            <form id="login-form" class="login-form" aria-describedby="login-help">
              <label class="login-field" for="email">
                <span class="login-label">Email <span aria-hidden="true">*</span></span>
                <input id="email" class="login-input" type="email" placeholder="Digite seu email ..." required />
              </label>
              <div class="login-field login-field-password">
                <label class="login-label" for="password">Senha <span aria-hidden="true">*</span></label>
                <div class="login-password-wrapper">
                  <input id="password" class="login-input" type="password" placeholder="Digite sua senha ..." required />
                  <button type="button" class="login-password-toggle" data-js="password-toggle" aria-label="Mostrar ou ocultar senha">👁</button>
                </div>
              </div>
              <p id="login-help" class="login-help">Use um e-mail e senha cadastrados.</p>
              <button type="submit" class="login-submit">Entrar</button>
            </form>
          </div>
          <div class="login-footer">
            <div class="login-mascot-area">
              <img class="login-mascot" src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/don_mascote_final.png" alt="Mascote Don acenando" />
              <div class="speech login-speech">Que bom te ver aqui de novo!</div>
            </div>
            <div class="login-signup">Novo por aqui? <a href="#/register">Cadastre-se aqui!</a></div>
          </div>
        </div>
      </main>
    `;
  },
  init(){
    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const toggle = document.querySelector('[data-js="password-toggle"]');
    if (toggle && passwordInput){
      toggle.addEventListener('click', ()=>{
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggle.textContent = isPassword ? '🙈' : '👁';
      });
    }
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      try{
        await supabase.login({email, password});
        window.a11yAnnounce('Login realizado com sucesso');
        // Iniciar música de fundo ao fazer login
        try{
          localStorage.setItem('bgm_pending', '1');
        }catch{}
        location.hash = '#/games';
      }catch(err){
        alert(err.message);
      }
    });
  }
};
