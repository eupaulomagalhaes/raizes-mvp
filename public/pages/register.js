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

const state = { step:1, data:{} };

function stepTemplate(){
  switch(state.step){
    case 1:
      return `
        ${UI.Input({id:'u_nome', label:'Nome Completo', required:true, placeholder:'Digite seu nome aqui...'})}
        ${UI.Input({id:'u_nasc', label:'Data de Nascimento', type:'date', required:true})}
        ${UI.Input({id:'u_cel', label:'Celular', required:true, placeholder:'(00) 0 0000-0000'})}
        ${UI.Input({id:'u_email', label:'E-mail', type:'email', required:true, placeholder:'seunome@email.com'})}
        ${UI.Select({id:'u_parentesco', label:'Grau de Parentesco', required:true, options:[
          {value:'mae', label:'Mãe'}, {value:'pai', label:'Pai'}, {value:'responsavel', label:'Responsável'}, {value:'outro', label:'Outro'}
        ]})}
        ${UI.Input({id:'u_password', label:'Senha (para criar sua conta)', type:'password', required:true})}
      `;
    case 2:
      return `
        ${UI.Select({id:'u_escolaridade', label:'Escolaridade', required:true, options:[
          {value:'fundamental', label:'Fundamental'}, {value:'medio', label:'Médio'}, {value:'superior', label:'Superior'}, {value:'pos', label:'Pós/Outros'}
        ]})}
        ${UI.Input({id:'u_prof', label:'Profissão', required:true, placeholder:'Digite sua profissão...'})}
        ${UI.Input({id:'u_cidade', label:'Cidade/Estado', required:true, placeholder:'Ex: São Paulo/SP'})}
      `;
    case 3:
      return `
        ${UI.Input({id:'c_nome', label:'Nome da criança', required:true})}
        ${UI.Input({id:'c_nasc', label:'Data de nascimento', type:'date', required:true})}
        ${UI.Select({id:'c_sexo', label:'Sexo', options:[
          {value:'f', label:'Feminino'}, {value:'m', label:'Masculino'}, {value:'n', label:'Prefiro não dizer'}
        ]})}
        ${UI.Select({id:'c_estuda', label:'Estuda?', options:[{value:'false', label:'Não'},{value:'true', label:'Sim'}]})}
        ${UI.Input({id:'c_tipo_escola', label:'Tipo de Escola', placeholder:'Pública, Particular, etc.'})}
      `;
    case 4:
      return `
        ${UI.Select({id:'c_terapia', label:'Faz algum tipo de terapia?', required:true, options:[{value:'false', label:'Não'},{value:'true', label:'Sim'}]})}
        ${UI.Input({id:'c_tipos', label:'Tipo(s) de Terapia', placeholder:'Separe com vírgulas'})}
        ${UI.Input({id:'c_outras', label:'Outras terapias', placeholder:'Opcional'})}
      `;
    case 5:
      return `
        <p>Revise seus dados e confirme o cadastro.</p>
        <ul class='list-disc pl-6 text-sm text-[var(--text-secondary)]'>
          <li><strong>Responsável:</strong> ${state.data.u_nome || ''}</li>
          <li><strong>Nascimento:</strong> ${state.data.u_nasc || ''}</li>
          <li><strong>Celular:</strong> ${state.data.u_cel || ''}</li>
          <li><strong>E-mail:</strong> ${state.data.u_email || ''}</li>
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
  // Validação simples de obrigatórios por passo
  const get = (id)=> document.getElementById(id)?.value?.trim();
  if (state.step===1){
    if (!get('u_nome') || !get('u_nasc') || !get('u_cel') || !get('u_email') || !get('u_parentesco') || !get('u_password')) return false;
    Object.assign(state.data, {
      u_nome:get('u_nome'), u_nasc:get('u_nasc'), u_cel:get('u_cel'), u_email:get('u_email'), u_parentesco:get('u_parentesco'), u_password:get('u_password')
    });
  }
  if (state.step===2){
    if (!get('u_escolaridade') || !get('u_prof') || !get('u_cidade')) return false;
    Object.assign(state.data, { u_escolaridade:get('u_escolaridade'), u_prof:get('u_prof'), u_cidade:get('u_cidade') });
  }
  if (state.step===3){
    if (!get('c_nome') || !get('c_nasc')) return false;
    Object.assign(state.data, {
      c_nome:get('c_nome'), c_nasc:get('c_nasc'), c_sexo:get('c_sexo'), c_estuda:get('c_estuda')==='true', c_tipo_escola:get('c_tipo_escola')
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
  root.innerHTML = `
    <div class='space-y-4'>
      <div class='flex items-center justify-between'>
        <div class='h3'>Cadastro (${state.step}/5)</div>
        ${UI.ProgressBar(percent)}
      </div>
      <div class='grid gap-3'>${stepTemplate()}</div>
      <div class='flex gap-2'>
        <button class='btn' data-variant='ghost' id='back' ${state.step===1?'disabled':''}>Voltar</button>
        <button class='btn' data-variant='primary' id='next'>${state.step===5?'Concluir':'Avançar'}</button>
      </div>
    </div>
  `;
  window.mascot.say([
    'Dados pessoais do responsável.','Dados complementares do responsável.','Agora, os dados da criança.','Informações de terapias da criança.','Confirme para finalizar.'
  ][state.step-1]);

  document.getElementById('back').addEventListener('click', ()=>{ if (state.step>1){ state.step--; renderWizard(); }});
  document.getElementById('next').addEventListener('click', async ()=>{
    if (!validate()){ alert('Preencha os campos obrigatórios (*) para continuar.'); return; }
    if (state.step<5){ state.step++; renderWizard(); return; }
    // Finalizar: cria conta (se necessário) e salva em usuarios/criancas
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
        // sem sessão: guardar pendência e tentar signUp
        supabase.setPendingOnboarding({ usuario, crianca });
        await supabase.registerAndSaveProfile({ name: state.data.u_nome, email: state.data.u_email, password: state.data.u_password });
        window.mascot.say('Verifique seu e-mail. Após entrar, concluiremos o cadastro automaticamente.');
        location.hash = '#/games';
        return;
      }

      // com sessão: salva direto
      const idUsuario = await supabase.upsertUsuario(usuario);
      await supabase.insertCrianca({ id_responsavel: idUsuario, crianca });
      window.a11yAnnounce('Cadastro concluído com sucesso');
      location.hash = '#/games';
    }catch(err){ alert(err.message); }
  });
}

export default {
  template(){
    return `
      <main class="space-y-6">
        <h1 class="h1">Cadastro</h1>
        <div class='card p-6' id='wizard'></div>
      </main>
    `;
  },
  init(){
    state.step = 1; state.data = {};
    renderWizard();
  }
};
