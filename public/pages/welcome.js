export default {
  template(){
    return `
      <main class="welcome-wrap bg-onboarding">
        <div class="welcome-top">
          <div class="pre">BEM-VINDO AO</div>
          <div class="badge">
            <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/logo_raizes_educacional.png" alt="Raízes Educacional" class="welcome-logo" />
            <div class="badge-text">Raízes Educacional</div>
          </div>
        </div>

        <section class="welcome-bottom">
          <div class="welcome-don">
            <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/don_mascote_final.png" alt="DON" />
          </div>
          <div class="welcome-right">
            <div class="welcome-bubble"><div class="speech" id="don-speech">Eu sou o Don!</div></div>
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
    // Verificar se TTS está habilitado
    const ttsEnabled = localStorage.getItem('tts_enabled') !== '0';
    
    // Falas do Don na welcome
    if (ttsEnabled && 'speechSynthesis' in window){
      // Carregar vozes
      const loadVoicesAndSpeak = ()=>{
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt'));
        
        const speechEl = document.getElementById('don-speech');
        
        // Primeira fala
        const speak = (text, callback)=>{
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'pt-BR';
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          if (ptVoice) utterance.voice = ptVoice;
          if (callback) utterance.onend = callback;
          window.speechSynthesis.speak(utterance);
        };
        
        // Sequência de falas
        setTimeout(()=>{
          speak('Eu sou o Don!', ()=>{
            if (speechEl) speechEl.textContent = 'Quero ajudar você!';
            setTimeout(()=>{
              speak('Quero ajudar você!');
            }, 300);
          });
        }, 500);
      };
      
      // Vozes podem demorar para carregar
      if (window.speechSynthesis.getVoices().length){
        loadVoicesAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoicesAndSpeak;
      }
    }
  }
};
