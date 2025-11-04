import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class='space-y-6'>
        <div class='flex items-center justify-between'>
          <h1 class='h1'>Jogos</h1>
          <div class='flex gap-2'>
            <a class='btn' data-variant='ghost' href='#/progress'>Progresso</a>
            <button id='signout' class='btn' data-variant='ghost'>Sair</button>
          </div>
        </div>
        <div id='games-list' class='grid gap-4 md:grid-cols-2'></div>
      </main>
    `;
  },
  async init(){
    const list = document.getElementById('games-list');
    const games = await supabase.listGames();
    list.innerHTML = games.map(g=> UI.Card(`
      <div class='flex items-start justify-between gap-2'>
        <div>
          <div class='h3'>${g.title}</div>
          <p class='text-sm text-[var(--text-secondary)]'>${g.description}</p>
        </div>
        <div>
          ${g.enabled ? `<a class='btn' data-variant='primary' href='#/games/${g.id}'>Jogar</a>` : `<span class='btn' data-variant='ghost' aria-disabled='true'>Em breve</span>`}
        </div>
      </div>
    `)).join('');

    document.getElementById('signout').addEventListener('click', ()=>{ supabase.signOut(); location.hash = '#/welcome'; });

    const session = supabase.getCurrentUser();
    window.mascot.say(session ? 'Escolha um jogo e divirta-se!' : 'Você está no modo convidado. Cadastre-se para salvar o progresso.');
  }
};
