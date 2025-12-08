import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class="settings-screen bg-app">
        <header class="settings-header">
          <h1>Configurações</h1>
        </header>
        
        <div class="settings-list">
          <div class="settings-section">
            <h2>Áudio</h2>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Música de fundo</span>
                <span class="setting-desc">Tocar música durante o app</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-bgm" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Voz do mascote</span>
                <span class="setting-desc">Don fala as instruções</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-tts" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-section">
            <h2>Conta</h2>
            <div class="setting-item clickable" id="btn-profile">
              <div class="setting-info">
                <span class="setting-label">Meu perfil</span>
                <span class="setting-desc" id="user-email">Carregando...</span>
              </div>
              <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            <div class="setting-item clickable danger" id="btn-logout">
              <div class="setting-info">
                <span class="setting-label">Sair da conta</span>
                <span class="setting-desc">Encerrar sessão</span>
              </div>
              <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
          </div>

          <div class="settings-section">
            <h2>Sobre</h2>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Versão</span>
                <span class="setting-desc">1.0.0</span>
              </div>
            </div>
            <div class="setting-item clickable" id="btn-privacy">
              <div class="setting-info">
                <span class="setting-label">Política de Privacidade</span>
              </div>
              <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async init(){
    // Carregar estado do BGM
    const bgmToggle = document.getElementById('toggle-bgm');
    if (bgmToggle && window.bgmController){
      bgmToggle.checked = window.bgmController.isEnabled();
      bgmToggle.addEventListener('change', ()=>{
        window.bgmController.setEnabled(bgmToggle.checked);
      });
    }
    
    // Carregar estado do TTS
    const ttsToggle = document.getElementById('toggle-tts');
    if (ttsToggle){
      const ttsEnabled = localStorage.getItem('tts_enabled') !== '0';
      ttsToggle.checked = ttsEnabled;
      ttsToggle.addEventListener('change', ()=>{
        localStorage.setItem('tts_enabled', ttsToggle.checked ? '1' : '0');
      });
    }
    
    // Carregar email do usuário
    const emailEl = document.getElementById('user-email');
    const user = supabase.getCurrentUser();
    if (emailEl){
      emailEl.textContent = user?.email || 'Não logado';
    }
    
    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async ()=>{
      if (confirm('Deseja realmente sair?')){
        await supabase.signOut();
        location.hash = '#/welcome';
      }
    });
    
    // Perfil (placeholder)
    document.getElementById('btn-profile')?.addEventListener('click', ()=>{
      alert('Funcionalidade em desenvolvimento');
    });
    
    // Privacidade (placeholder)
    document.getElementById('btn-privacy')?.addEventListener('click', ()=>{
      alert('Política de Privacidade em desenvolvimento');
    });
  }
};
