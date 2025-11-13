import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

// Wizard de 5 passos (Pais/Responsáveis → Criança) alinhado às tabelas
// usuarios: nome_completo, data_nascimento, parentesco, escolaridade, profissao, email, celular, cidade_estado
// criancas: nome_completo, data_nascimento, sexo, estuda, tipo_escola, terapia, tipos_terapia[], outras_terapias
// Passo 1: Responsável - Dados Pessoais (nome_completo*, data_nascimento*, celular*, email*, parentesco*)
// Passo 2: Responsável - Dados Complementares (escolaridade*, profissao*, cidade_estado*)
// Passo 3: Criança - Dados (nome_completo*, data_nascimento*, sexo, estuda, tipo_escola)
// Passo 4: Criança - Terapias (terapia*, tipos_terapia, outras_terapias)
// Passo 5: Confirmação e salvar (cria auth user se necessário e salva em tabelas)

const STEP_CONTENT = [
  {
    heading:'Conta de Acesso',
    speech:'Comece criando seu login para seguir com o cadastro.'
  },
  {
    heading:'Dados do Responsável',
    speech:'Agora precisamos conhecer um pouco mais sobre você.'
  },
  {
    heading:'Dados da Criança',
    speech:'Vamos falar sobre a criança?'
  },
  {
    heading:'Terapias',
    speech:'Isso nos ajuda a apoiar com mais carinho.'
  },
  {
    heading:'Confirmação',
    speech:'Revise tudo com atenção antes de concluir.'
  }
];

const state = { step:1, data:{}, authEmail:null, authReady:false, emailTaken:false };

function stepTemplate(){
  switch(state.step){
    case 1:
      return `
        ${UI.Input({id:'u_email', label:'E-mail', type:'email', required:true, placeholder:'seunome@email.com', attrs:'autocomplete="email"'})}
        ${UI.Input({id:'u_password', label:'Senha', type:'password', required:true, placeholder:'Crie sua senha', attrs:'minlength="6" autocomplete="new-password" data-mask-password="1"'})}
        ${UI.Input({id:'u_password2', label:'Confirme sua senha', type:'password', required:true, placeholder:'Repita a senha', attrs:'minlength="6" autocomplete="new-password" data-mask-password="1" data-password-confirm="1"'})}
      `;
    case 2:
      return `
        ${UI.Input({id:'u_nome', label:'Nome Completo', required:true, placeholder:'Digite seu nome aqui...', attrs:'autocomplete="name"'})}
        ${UI.Input({id:'u_nasc', label:'Data de Nascimento', required:true, placeholder:'00/00/0000', attrs:'data-mask="date" inputmode="numeric" maxlength="10"'})}
        ${UI.Input({id:'u_cel', label:'Celular', required:true, placeholder:'(00) 0 0000-0000', attrs:'data-mask="phone" inputmode="numeric" maxlength="17" autocomplete="tel" data-mask-phone="1"'})}
        ${UI.Select({id:'u_parentesco', label:'Grau de Parentesco', required:true, options:[
          {value:'mae', label:'Mãe'}, {value:'pai', label:'Pai'}, {value:'responsavel', label:'Responsável'}, {value:'outro', label:'Outro'}
        ], attrs:'autocomplete="relationship"'})}
        ${UI.Select({id:'u_escolaridade', label:'Escolaridade', required:true, options:[
          {value:'fundamental', label:'Fundamental'}, {value:'medio', label:'Médio'}, {value:'superior', label:'Superior'}, {value:'pos', label:'Pós/Outros'}
        ]})}
        ${UI.Input({id:'u_prof', label:'Profissão', required:true, placeholder:'Digite sua profissão...'})}
        ${UI.Input({id:'u_cidade', label:'Cidade/Estado', required:true, placeholder:'Ex: São Paulo/SP', attrs:'list="cities-list" autocomplete="off"'})}
      `;
    case 3:
      return `
        ${UI.Input({id:'c_nome', label:'Nome da criança', required:true})}
        ${UI.Input({id:'c_nasc', label:'Data de nascimento', required:true, placeholder:'00/00/0000', attrs:'data-mask="date" inputmode="numeric" maxlength="10"'})}
        ${UI.Select({id:'c_sexo', label:'Sexo', options:[
          {value:'f', label:'Feminino'}, {value:'m', label:'Masculino'}, {value:'n', label:'Prefiro não dizer'}
        ]})}
        ${UI.Select({id:'c_estuda', label:'Estuda?', options:[{value:'false', label:'Não'},{value:'true', label:'Sim'}]})}
        ${UI.Input({id:'c_tipo_escola', label:'Tipo de Escola', placeholder:'Pública, Particular, etc.'})}
      `;
    case 4:
      return `
        ${UI.Select({id:'c_terapia', label:'Faz algum tipo de terapia?', options:[{value:'false', label:'Não'},{value:'true', label:'Sim'}]})}
        ${UI.Select({id:'c_tipos', label:'Tipo(s) de Terapia', options:[
          {value:'fonoaudiologia', label:'Fonoaudiologia'},
          {value:'terapia_ocupacional', label:'Terapia Ocupacional'},
          {value:'psicologia', label:'Psicologia'},
          {value:'psicopedagogia', label:'Psicopedagogia'},
          {value:'outros', label:'Outros'}
        ]})}
        ${UI.Input({id:'c_outras', label:'Outras Terapia', placeholder:'Opcional'})}
      `;
    case 5:
      return `
        <p>Revise seus dados e confirme o cadastro.</p>
        <ul class='list-disc pl-6 text-sm text-[var(--text-secondary)]'>
          <li><strong>E-mail:</strong> ${state.data.u_email || ''}</li>
          <li><strong>Responsável:</strong> ${state.data.u_nome || ''}</li>
          <li><strong>Nascimento:</strong> ${state.data.u_nasc || ''}</li>
          <li><strong>Celular:</strong> ${state.data.u_cel || ''}</li>
          <li><strong>Parentesco:</strong> ${state.data.u_parentesco || ''}</li>
          <li><strong>Escolaridade:</strong> ${state.data.u_escolaridade || ''}</li>
          <li><strong>Profissão:</strong> ${state.data.u_prof || ''}</li>
          <li><strong>Cidade/Estado:</strong> ${state.data.u_cidade || ''}</li>
          <li><strong>Criança:</strong> ${state.data.c_nome || ''}</li>
          <li><strong>Nascimento:</strong> ${state.data.c_nasc || ''}</li>
          <li><strong>Sexo:</strong> ${state.data.c_sexo || ''}</li>
          <li><strong>Estuda:</strong> ${state.data.c_estuda ? 'Sim' : 'Não'}</li>
          <li><strong>Tipo de Escola:</strong> ${state.data.c_tipo_escola || ''}</li>
          <li><strong>Terapia:</strong> ${state.data.c_terapia ? 'Sim' : 'Não'}</li>
          <li><strong>Tipos de Terapia:</strong> ${state.data.c_tipos || ''}</li>
          <li><strong>Outras terapias:</strong> ${state.data.c_outras || ''}</li>
        </ul>
      `;
    default: return '';
  }
}

function validate(){
  clearErrors();
  const requiredIds = getRequiredFieldsForStep(state.step);
  const invalid = [];
  requiredIds.forEach((id)=>{
    const el = document.getElementById(id);
    const value = el?.value.trim();
    if (!value){
      markError(el, 'Campo obrigatório');
      invalid.push(id);
    }else if (id === 'u_cel' && !isValidPhone(value)){
      markError(el, 'Informe um celular válido');
      invalid.push(id);
    }else if (id === 'u_email' && !isValidEmail(value)){
      markError(el, 'Formato de e-mail inválido');
      invalid.push(id);
    }else if ((id === 'u_nasc' || id === 'c_nasc') && !isValidDateBR(value)){
      markError(el, 'Data inválida. Use dd/mm/aaaa');
      invalid.push(id);
    }
  });

  // senha e confirmação iguais (apenas quando presentes na etapa)
  if (state.step === 1){
    const p1 = document.getElementById('u_password')?.value || '';
    const p2 = document.getElementById('u_password2')?.value || '';
    if (p1 && p2 && p1 !== p2){
      markError(document.getElementById('u_password2'), 'As senhas não coincidem');
      invalid.push('u_password2');
    }
    if (state.emailTaken){
      const emailInput = document.getElementById('u_email');
      markError(emailInput, 'E-mail já cadastrado!');
      invalid.push('u_email');
    }
  }

  if (invalid.length>0) return false;

  const get = (id)=> document.getElementById(id)?.value?.trim();
  if (state.step===1){
    Object.assign(state.data, {
      u_email:get('u_email'),
      u_password:get('u_password')
    });
  }
  if (state.step===2){
    Object.assign(state.data, {
      u_nome:get('u_nome'),
      u_nasc:get('u_nasc'),
      u_cel:get('u_cel'),
      u_parentesco:get('u_parentesco'),
      u_escolaridade:get('u_escolaridade'),
      u_prof:get('u_prof'),
      u_cidade:get('u_cidade')
    });
  }
  if (state.step===3){
    Object.assign(state.data, {
      c_nome:get('c_nome'),
      c_nasc:get('c_nasc'),
      c_sexo:get('c_sexo'),
      c_estuda:get('c_estuda')==='true',
      c_tipo_escola:get('c_tipo_escola')
    });
  }
  if (state.step===4){
    Object.assign(state.data, {
      c_terapia:get('c_terapia')==='true',
      c_tipos:get('c_tipos')||'',
      c_outras:get('c_outras')||''
    });
  }
  return true;
}

function renderWizard(){
  const root = document.getElementById('wizard');
  const percent = Math.round((state.step-0.5)/5*100);
  root.innerHTML = `<div class='register-fields-grid'>${stepTemplate()}</div>`;

  const progressBar = document.querySelector('#register-progress .bar');
  if (progressBar) progressBar.style.width = `${percent}%`;
  const stepCounter = document.querySelector('[data-step-counter]');
  if (stepCounter) stepCounter.textContent = `${state.step}/5`;
  const stepHeading = document.querySelector('[data-step-heading]');
  const speech = document.querySelector('[data-step-speech]');
  const content = STEP_CONTENT[state.step-1];
  if (stepHeading && content) stepHeading.textContent = content.heading;
  if (speech && content) speech.textContent = content.speech;

  const backButton = document.getElementById('btn-back');
  const nextButton = document.getElementById('btn-next');
  if (backButton){
    backButton.disabled = false;
    backButton.removeAttribute('disabled');
  }
  if (nextButton) nextButton.textContent = state.step === 5 ? 'Concluir' : 'Avançar';

  attachMasks(root);
  setupPasswordToggle();
  setupCityAutocomplete();
  setupEmailAvailabilityChecker();
}

export default {
  template(){
    return `
      <main class="register-wrap bg-register">
        <div class="register-inner">
          <header class="register-header">
            <h1 class="register-title">PAIS OU RESPONSÁVEIS</h1>
            <p class="register-subtitle" data-step-heading>Dados Pessoais</p>
          </header>

          <section class="register-card">
            <div class="register-card-progress">
              <span class="register-step-indicator" data-step-counter>1/5</span>
              ${UI.ProgressBar(0, 'id="register-progress"')}
            </div>
            <div id="wizard" class="register-fields"></div>
          </section>

          <footer class="register-footer">
            <div class="register-mascot-area">
              <img src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/5m2imr90fuaf/inteiro.png" alt="DON" class="register-mascot" />
              <div class="speech register-speech" data-step-speech>Cada informação fornecida, aumentará o nosso elo!</div>
            </div>
            <div class="register-actions">
              <button type="button" class="register-btn register-btn-ghost" id="btn-back">Voltar</button>
              <button type="button" class="register-btn register-btn-primary" id="btn-next">Avançar</button>
            </div>
          </footer>
        </div>
        <datalist id="cities-list"></datalist>
      </main>
    `;
  },
  init(ctx = {}){
    state.step = 1; state.data = {};
    const backButton = document.getElementById('btn-back');
    const nextButton = document.getElementById('btn-next');
    const goTo = typeof ctx.navigate === 'function'
      ? (path)=> ctx.navigate(path)
      : (path)=>{ location.hash = `#${path}`; };
    if (backButton) backButton.addEventListener('click', ()=>{
      if (state.step>1){
        state.step--;
        renderWizard();
        return;
      }
      goTo('/welcome');
    });
    if (nextButton) nextButton.addEventListener('click', async ()=>{
      if (!validate()){
        if (state.step === 1 && state.emailTaken) return;
        alert('Preencha os campos obrigatórios (*) para continuar.');
        return;
      }
      if (state.step<5){
        if (state.step === 1){
          const ok = await ensureAuthSession();
          if (!ok) return;
        }
        state.step++;
        renderWizard();
        return;
      }
      try{
        const usuario = {
          nome_completo: state.data.u_nome,
          data_nascimento: state.data.u_nasc,
          parentesco: state.data.u_parentesco,
          escolaridade: state.data.u_escolaridade,
          profissao: state.data.u_prof,
          email: state.data.u_email,
          celular: state.data.u_cel,
          cidade_estado: state.data.u_cidade,
        };
        const crianca = {
          nome_completo: state.data.c_nome,
          data_nascimento: state.data.c_nasc,
          sexo: state.data.c_sexo,
          estuda: !!state.data.c_estuda,
          tipo_escola: state.data.c_tipo_escola || null,
          terapia: !!state.data.c_terapia,
          tipos_terapia: (state.data.c_tipos||'').split(',').map(s=>s.trim()).filter(Boolean),
          outras_terapias: state.data.c_outras || null,
        };

        const current = supabase.getCurrentUser();
        if (!current){
          supabase.setPendingOnboarding({ usuario, crianca });
          try{
            await supabase.registerAndSaveProfile({ name: state.data.u_nome, email: state.data.u_email, password: state.data.u_password });
          }catch(err){
            const msg = String(err?.message||'');
            if (/already\s+registered|already\s+exists|exists/i.test(msg)){
              alert('E-mail já cadastrado');
              return;
            }
            alert(msg || 'Erro ao cadastrar');
            return;
          }
          // Se confirmação de e-mail estiver habilitada, não haverá sessão agora
          const hasSession = !!supabase.getCurrentUser();
          if (!hasSession){
            alert('Enviamos um e-mail de confirmação. Confirme e faça login para concluir seu cadastro.');
            goTo('/login');
            return;
          }
          goTo('/games');
          return;
        }

        const idUsuario = await supabase.upsertUsuario(usuario);
        await supabase.insertCrianca({ id_responsavel: idUsuario, crianca });
        window.a11yAnnounce('Cadastro concluído com sucesso');
        goTo('/games');
      }catch(err){
        const msg = String(err?.message||'');
        if (/already\s+registered|already\s+exists|exists/i.test(msg)){
          alert('E-mail já cadastrado');
        } else {
          alert(msg || 'Erro inesperado');
        }
      }
    });
    renderWizard();
  }
};

function attachMasks(root){
  const inputs = root.querySelectorAll('[data-mask]');
  inputs.forEach((input)=>{
    if (input.dataset.maskBound) return;
    const type = input.dataset.mask;
    const handler = ()=>{
      const digits = input.value.replace(/\D/g,'');
      let formatted = digits;
      if (type === 'date'){
        formatted = digits.slice(0,8);
        if (formatted.length >= 5) formatted = `${formatted.slice(0,2)}/${formatted.slice(2,4)}/${formatted.slice(4)}`;
        else if (formatted.length >= 3) formatted = `${formatted.slice(0,2)}/${formatted.slice(2)}`;
      }
      if (type === 'phone'){
        formatted = digits.slice(0,11);
        if (formatted.length === 11){
          formatted = `(${formatted.slice(0,2)}) ${formatted.slice(2,3)}-${formatted.slice(3,7)} ${formatted.slice(7)}`;
        } else if (formatted.length === 10){
          formatted = `(${formatted.slice(0,2)}) ${formatted.slice(2,6)} ${formatted.slice(6)}`;
        } else if (formatted.length > 6){
          formatted = `(${formatted.slice(0,2)}) ${formatted.slice(2,6)} ${formatted.slice(6)}`;
        } else if (formatted.length > 2){
          formatted = `(${formatted.slice(0,2)}) ${formatted.slice(2)}`;
        } else if (formatted.length > 0){
          formatted = `(${formatted}`;
        }
      }
      if (type === 'cpf'){
        formatted = digits.slice(0,11);
        if (formatted.length > 9) formatted = `${formatted.slice(0,3)}.${formatted.slice(3,6)}.${formatted.slice(6,9)}-${formatted.slice(9)}`;
        else if (formatted.length > 6) formatted = `${formatted.slice(0,3)}.${formatted.slice(3,6)}.${formatted.slice(6)}`;
        else if (formatted.length > 3) formatted = `${formatted.slice(0,3)}.${formatted.slice(3)}`;
      }
      input.value = formatted;
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    input.addEventListener('keypress', (ev)=>{
      if (type === 'phone' || type === 'date' || type === 'cpf'){
        if (!/[0-9]/.test(ev.key)) ev.preventDefault();
      }
    });
    input.dataset.maskBound = '1';
    handler();
  });
}

function setupPasswordToggle(){
  const inputs = document.querySelectorAll('[data-mask-password]');
  inputs.forEach((passwordInput)=>{
    if (!passwordInput || passwordInput.dataset.toggleReady) return;
    passwordInput.dataset.toggleReady = '1';
    const wrapper = passwordInput.parentElement;
    wrapper.classList.add('register-password-wrapper');
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'register-password-toggle';
    toggleBtn.setAttribute('aria-label', 'Mostrar ou ocultar senha');
    toggleBtn.textContent = '👁';
    toggleBtn.addEventListener('click', ()=>{
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });
    wrapper.style.position = 'relative';
    wrapper.appendChild(toggleBtn);
  });
  const confirm = document.querySelector('[data-password-confirm]');
  if (confirm && !confirm.dataset.matchWatcher){
    confirm.dataset.matchWatcher = '1';
    const renderHint = ()=>{
      const base = confirm.parentElement;
      let hint = base.querySelector('.input-hint');
      const pass = document.getElementById('u_password')?.value || '';
      const confirmValue = confirm.value || '';
      const matches = !confirmValue || pass === confirmValue;
      if (!matches){
        if (!hint){
          hint = document.createElement('div');
          hint.className = 'input-hint';
          base.appendChild(hint);
        }
        hint.textContent = '* Senha não é a mesma';
        confirm.classList.add('has-error');
      }else{
        if (hint) hint.remove();
        confirm.classList.remove('has-error');
      }
    };
    confirm.addEventListener('input', renderHint);
    document.getElementById('u_password')?.addEventListener('input', renderHint);
  }
}

function setupEmailAvailabilityChecker(){
  const input = document.getElementById('u_email');
  if (!input || input.dataset.availabilityWatcher) return;
  input.dataset.availabilityWatcher = '1';
  const runCheck = debounce(async ()=>{
    const email = input.value.trim();
    if (!email || !isValidEmail(email)){
      state.emailTaken = false;
      clearEmailDuplicateHint();
      return;
    }
    try{
      if (typeof supabase?.emailExists === 'function'){
        const exists = await supabase.emailExists(email);
        state.emailTaken = !!exists;
        if (state.emailTaken){
          showEmailDuplicateHint();
        }else{
          clearEmailDuplicateHint();
        }
      }
    }catch(err){
      console.error('Falha ao verificar e-mail', err);
    }
  }, 400);
  input.addEventListener('input', ()=>{
    state.emailTaken = false;
    clearEmailDuplicateHint();
    runCheck();
  });
  input.addEventListener('blur', ()=> runCheck());
}

function getRequiredFieldsForStep(step){
  switch(step){
    case 1: return ['u_email','u_password','u_password2'];
    case 2: return ['u_nome','u_nasc','u_cel','u_parentesco','u_escolaridade','u_prof','u_cidade'];
    case 3: return ['c_nome','c_nasc'];
    case 4: return [];
    default: return [];
  }
}

function markError(input, message){
  if (!input) return;
  input.classList.add('has-error');
  let hint = input.parentElement.querySelector('.input-hint');
  if (!hint){
    hint = document.createElement('div');
    hint.className = 'input-hint';
    input.parentElement.appendChild(hint);
  }
  hint.textContent = `* ${message}`;
}

function clearErrors(){
  document.querySelectorAll('.has-error').forEach(el=> el.classList.remove('has-error'));
  document.querySelectorAll('.input-hint').forEach(el=> el.remove());
}

function showEmailDuplicateHint(){
  const input = document.getElementById('u_email');
  if (!input) return;
  input.classList.add('has-error');
  let hint = input.parentElement.querySelector('.input-hint');
  if (!hint){
    hint = document.createElement('div');
    hint.className = 'input-hint';
    input.parentElement.appendChild(hint);
  }
  hint.textContent = 'E-mail já cadastrado!';
}

function clearEmailDuplicateHint(){
  const input = document.getElementById('u_email');
  if (!input) return;
  if (!state.emailTaken) input.classList.remove('has-error');
  const hint = input.parentElement?.querySelector('.input-hint');
  if (hint && hint.textContent === 'E-mail já cadastrado!'){
    hint.remove();
  }
}

function isValidPhone(value){
  const digits = value.replace(/\D/g,'');
  return digits.length === 10 || digits.length === 11;
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function isValidDateBR(value){
  // dd/mm/aaaa
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!m) return false;
  const d = parseInt(m[1],10), mo = parseInt(m[2],10)-1, y = parseInt(m[3],10);
  const dt = new Date(y, mo, d);
  return dt.getFullYear()===y && dt.getMonth()===mo && dt.getDate()===d;
}

function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

async function setupCityAutocomplete(){
  try{
    const input = document.getElementById('u_cidade');
    const dl = document.getElementById('cities-list');
    if (!input || !dl) return;
    const client = (typeof supabase?.getClient === 'function') ? supabase.getClient() : ((supabase && (supabase.client || supabase.sb || supabase._client)) || window?.supabase?.client || null);
    if (!client){
      // graceful no-op if client not available
      return;
    }
    const fill = (rows=[])=>{
      dl.innerHTML = '';
      rows.forEach(r=>{
        const opt = document.createElement('option');
        const value = r.cidade_uf || (r.nome_cidade ? `${r.nome_cidade}/${r.uf||''}`.replace(/\/\s*$/, '') : '');
        opt.value = value;
        dl.appendChild(opt);
      });
    };
    const norm = (s)=> (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const fetchCities = async (term)=>{
      const q = client
        .from('cidades')
        .select('id_cidade, nome_cidade, uf, cidade_uf')
        .limit(200);
      let data, error;
      try{
        // Para evitar perder resultados por acentos, trazemos um lote e filtramos no cliente
        // Se houver termo, tentamos um ilike amplo; caso contrário, apenas limitamos
        if (term && term.length >= 1) {
          ({ data, error } = await q.ilike('cidade_uf', `%${term}%`));
          if (error) ({ data, error } = await q); // fallback sem filtro
        } else {
          ({ data, error } = await q);
        }
      }catch{ data = []; error = null; }
      if (error){ fill([]); return; }
      const t = norm(term||'');
      const filtered = (data||[])
        .filter(r=> !t || norm(r.cidade_uf||`${r.nome_cidade||''}/${r.uf||''}`).includes(t))
        .slice(0, 20);
      fill(filtered);
    };
    const onInput = debounce((ev)=> fetchCities(ev.target.value.trim()), 250);
    input.addEventListener('input', onInput);
    input.addEventListener('focus', ()=> fetchCities(input.value.trim()));
  }catch{}
}

async function ensureAuthSession(){
  const email = document.getElementById('u_email')?.value.trim();
  const password = document.getElementById('u_password')?.value || '';
  if (!email || !password) return false;

  if (state.authReady && state.authEmail === email) return true;

  const current = supabase.getCurrentUser();
  const currentEmail = current?.user?.email;
  if (currentEmail && currentEmail !== email){
    try{ await supabase.signOut(); }catch{}
  } else if (currentEmail === email){
    state.authEmail = email;
    state.authReady = true;
    return true;
  }

  try{
    await supabase.registerAndSaveProfile({ name: email.split('@')[0] || email, email, password });
  }catch(err){
    const msg = String(err?.message||'');
    if (/already\s+registered|already\s+exists|exists/i.test(msg)){
      state.emailTaken = true;
      showEmailDuplicateHint();
      try{
        await supabase.login({ email, password });
        state.authEmail = email;
        state.authReady = true;
        return true;
      }catch(loginErr){
        alert('E-mail já cadastrado. Verifique sua senha ou utilize outro e-mail.');
        console.error(loginErr);
        return false;
      }
    }
    alert(msg || 'Erro ao cadastrar');
    console.error(err);
    return false;
  }

  let user = supabase.getCurrentUser();
  if (!user){
    try{
      await supabase.login({ email, password });
      user = supabase.getCurrentUser();
    }catch(loginErr){
      alert('Enviamos um e-mail de confirmação. Confirme e faça login para continuar.');
      console.error(loginErr);
      return false;
    }
  }
  state.authEmail = email;
  state.authReady = !!user;
  return !!user;
}
