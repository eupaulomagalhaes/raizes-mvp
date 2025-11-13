import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class="games-screen">
        <div class="games-wrapper">
          <div class="games-mascot">
            <div class="games-mascot-avatar">
              <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/inteiro.png" alt="Mascote Don" />
            </div>
            <div class="speech games-speech">VAMOS BRINCAR!</div>
          </div>
          <h1 class="games-title">Escolha um jogo</h1>
          <p class="games-greeting" id="games-greeting">Olá de novo!</p>
          <p class="games-hint" id="games-hint"></p>
          <ul class="games-list" id="games-list"></ul>
          <div class="games-actions">
            <a href="#/progress" class="games-link">Ver progresso</a>
            <button id="games-signout" class="games-link games-link-button" type="button">Sair</button>
          </div>
        </div>
      </main>
    `;
  },
  async init(){
    const list = document.getElementById('games-list');
    const greetingEl = document.getElementById('games-greeting');
    const hintEl = document.getElementById('games-hint');
    const signoutBtn = document.getElementById('games-signout');
    const games = await supabase.listGames();
    const { usuario, criancas } = await supabase.getUserBundle();

    let activeChildId = supabase.getActiveChild();
    if (criancas.length){
      const exists = criancas.some(c=> c.id === activeChildId);
      if (!exists){
        activeChildId = criancas[0].id;
        supabase.setActiveChild(activeChildId);
      }
    } else {
      activeChildId = null;
    }
    const activeChild = activeChildId ? criancas.find(c=> c.id === activeChildId) : null;

    if (greetingEl){
      const setGreeting = (name)=>{
        greetingEl.innerHTML = '';
        if (name){
          greetingEl.append('Olá de novo, ');
          const strong = document.createElement('strong');
          strong.textContent = name;
          greetingEl.append(strong, '!');
        } else {
          greetingEl.textContent = 'Olá de novo!';
        }
      };
      if (activeChild?.name){
        setGreeting(activeChild.name);
      } else if (usuario?.nome_completo){
        const firstName = usuario.nome_completo.split(' ')[0] || usuario.nome_completo;
        setGreeting(firstName);
      } else {
        setGreeting(null);
      }
    }

    if (hintEl){
      if (!criancas.length){
        hintEl.textContent = 'Cadastre uma criança no cadastro para vincular as sessões.';
      } else {
        hintEl.textContent = '';
      }
    }

    if (list){
      list.innerHTML = games.map((g, idx)=>{
        if (idx === 0){
          const enabled = !!g.enabled;
          const linkAttrs = enabled ? `href='#/games/${g.id}'` : "href='javascript:void(0)' aria-disabled='true'";
          return `
            <li class="game-entry game-entry-primary">
              <a class="game-entry-link" ${linkAttrs}>
                <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_01.png" alt="Caixa misteriosa" class="game-entry-icon" />
                <span class="game-entry-title">${g.title}</span>
              </a>
            </li>
          `;
        }
        return `
          <li class="game-entry game-entry-disabled">
            <span class="game-entry-number">#${idx+1}</span>
            <div class="game-entry-body">
              <span class="game-entry-title">${g.title}</span>
              <span class="game-entry-tag">Em breve</span>
            </div>
          </li>
        `;
      }).join('');
    }

    if (signoutBtn){
      signoutBtn.addEventListener('click', ()=>{
        supabase.signOut();
        location.hash = '#/welcome';
      });
    }

    window.mascot?.say?.(activeChild?.name ? `Vamos brincar, ${activeChild.name}!` : 'Vamos brincar!');
  }
};
