export default {
  template(){
    return `
      <main class="welcome-wrap bg-onboarding">
        <div class="welcome-top">
          <div class="pre">BEM-VINDO AO</div>
          <div class="badge">
            <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/logo_raizes_educacional.png" alt="Raízes Educacional" class="welcome-logo" />
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
    // Toggle global passa a ser controlado em app.js
  }
};
