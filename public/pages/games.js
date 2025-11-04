import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class='screen bg-onboarding p-4 md:p-6'>
        <div class='flex items-start justify-between'>
          <div class='speech-inline'>VAMOS BRINCAR!</div>
          <div class='flex gap-2'>
            <a class='btn' data-variant='ghost' href='#/progress'>Progresso</a>
            <button id='signout' class='btn' data-variant='ghost'>Sair</button>
          </div>
        </div>
        <div class='mt-3 card p-4' style='background:rgba(255,255,255,.9)'>
          <div id='child-picker' class='mb-4'></div>
          <div id='games-list' class='grid gap-3'></div>
        </div>
      </main>
    `;
  },
  async init(){
    const picker = document.getElementById('child-picker');
    const list = document.getElementById('games-list');
    const games = await supabase.listGames();
    const session = supabase.getCurrentUser();

    // Child picker (se logado)
    if (session){
      try{
        const children = await supabase.listChildren(session.user.id);
        if (children.length){
          const active = supabase.getActiveChild() || children[0].id;
          if (!supabase.getActiveChild()) supabase.setActiveChild(active);
          picker.innerHTML = UI.Select({ id: 'active-child', label: 'Selecione a criança', required: true, options: children.map(c=>({ value: c.id, label: c.name || c.nome_completo || 'Criança' })) });
          const sel = document.getElementById('active-child');
          sel.value = active;
          sel.addEventListener('change', (e)=> supabase.setActiveChild(e.target.value));
        } else {
          picker.innerHTML = `<div class='text-sm text-[var(--text-secondary)]'>Cadastre uma criança no Cadastro para vincular as sessões.</div>`;
        }
      }catch(e){ /* noop */ }
    } else {
      picker.innerHTML = `<div class='text-sm text-[var(--text-secondary)]'>Modo convidado: selecione um jogo abaixo (progresso não será salvo).</div>`;
    }

    list.innerHTML = games.map((g, idx)=> `
      <div class='game-card'>
        <div class='flex items-center gap-3'>
          <div class='num'>#${idx+1}</div>
          <div>
            <div class='h3 m-0'>${g.title}</div>
            <div class='text-sm text-[var(--text-secondary)]'>${g.description}</div>
          </div>
        </div>
        <div>
          ${g.enabled ? `<a class='btn' data-variant='primary' href='#/games/${g.id}'>Jogar</a>` : `<span class='btn' data-variant='ghost' aria-disabled='true'>Em breve</span>`}
        </div>
      </div>
    `).join('');

    document.getElementById('signout').addEventListener('click', ()=>{ supabase.signOut(); location.hash = '#/welcome'; });

    window.mascot.say(session ? 'Escolha um jogo e divirta-se!' : 'Você está no modo convidado. Cadastre-se para salvar o progresso.');
  }
};
