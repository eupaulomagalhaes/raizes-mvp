import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class="hero bg-onboarding">
        <div class="text-center">
          <div class="brand-badge">
            <div class="text-sm tracking-wide text-[var(--text-secondary)]">OLÁ DE NOVO!</div>
            <div class="brand-title">Raízes</div>
            <div class="brand-sub">EDUCACIONAL</div>
          </div>
        </div>
        <div class="form-panel">
          <form id='login-form' class='space-y-4' aria-describedby='login-help'>
            ${UI.Input({id:'email', label:'Email', type:'email', required:true, placeholder:'Digite seu email ...'})}
            ${UI.Input({id:'password', label:'Senha', type:'password', required:true, placeholder:'Digite sua senha ...'})}
            <p id='login-help' class='text-sm text-[var(--text-secondary)]'>Use um e-mail e senha cadastrados.</p>
            <div class='flex gap-2'>
              ${UI.Button({label:'Entrar', variant:'primary', type:'submit'})}
              <a class='btn' data-variant='ghost' href='#/welcome'>Cancelar</a>
            </div>
            <div class='text-sm text-[var(--text-secondary)]'>Novo por aqui? <a class='underline text-[var(--color-primary)]' href='#/register'>Cadastre-se aqui!</a></div>
          </form>
        </div>
      </main>
    `;
  },
  init(){
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      try{
        await supabase.login({email, password});
        window.a11yAnnounce('Login realizado com sucesso');
        location.hash = '#/games';
      }catch(err){
        alert(err.message);
      }
    });
  }
};
