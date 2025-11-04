import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

const ASSETS = {
  toys: [
    'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/6phciygomokz/girafa.png',
    'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/56m4fn589h6t/robo.png',
    'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/wesizm8ja38i/dinossauro.png',
  ],
  box: 'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/58m14sn7bf1j/mistery_box_01.png',
};

const state = {
  level: 1, // 1=>3x3, 2=>4x4, 3=>5x5
  round: 0,
  maxRounds: 10,
  sessionId: null,
  targetIndex: -1,
  canPick: false,
  startTs: 0,
  demo: false,
  focused: 0,
  size: 3,
};

function gridSize(){ return [3,4,5][Math.min(2, state.level-1)] || 3; }
function cellCount(){ const n = gridSize(); return n*n; }

function pageTemplate(){
  return `
    <main class='space-y-4 bg-room p-4 md:p-6 rounded-2xl' aria-label='Jogo Onde está o brinquedo'>
      <div class='flex items-center justify-between'>
        <h1 class='h1'>Onde está o brinquedo!</h1>
        <a class='btn' data-variant='ghost' href='#/games'>Voltar</a>
      </div>
      ${UI.Card(`
        <div class='space-y-3'>
          <div class='flex items-center justify-between'>
            <div class='h3'>Rodada <span id='round'>0</span> / <span id='max'>${state.maxRounds}</span></div>
            <div class='text-sm text-[var(--text-secondary)]'>Nível: <span id='level'>${state.level}</span> (${gridSize()}x${gridSize()})</div>
          </div>
          <div id='grid-wrap' class='relative'>
            <div class='grid-game' id='grid' style='grid-template-columns: repeat(${gridSize()}, minmax(0, 1fr));'></div>
            <div id='hand-hint' aria-hidden='true' style='position:absolute; left:0; top:0; width:100px; height:100px; display:none; pointer-events:none'></div>
          </div>
        </div>
      `)}
    </main>
  `;
}

function randomTarget(){ return Math.floor(Math.random()*cellCount()); }
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

async function playRound(){
  state.round++;
  updateHeader();
  state.targetIndex = randomTarget();
  const toyUrl = ASSETS.toys[Math.floor(Math.random()*ASSETS.toys.length)];
  const grid = document.getElementById('grid');
  const cells = [...grid.children];
  // Mostrar alvo por 1s
  cells.forEach(c => c.style.backgroundImage = `url(${ASSETS.box})`);
  cells[state.targetIndex].style.backgroundImage = `url(${toyUrl})`;
  cells[state.targetIndex].classList.add('correct');
  window.mascot.say('Olhe com atenção...');
  await sleep(1000);
  cells[state.targetIndex].classList.remove('correct');
  cells.forEach(c => c.style.backgroundImage = `url(${ASSETS.box})`);
  // Embaralhar ordem visual
  for (let i=0;i<cells.length;i++){ cells[i].style.order = Math.floor(Math.random()*1000); }
  state.canPick = true;
  state.startTs = performance.now();
  window.a11yAnnounce('Brinquedo escondido, escolha um quadrado');
  focusIndex(state.focused);
  showHandHint();
}

function updateHeader(){
  const roundEl = document.getElementById('round');
  const levelEl = document.getElementById('level');
  if (roundEl) roundEl.textContent = state.round;
  if (levelEl) levelEl.textContent = state.level;
}

function buildGrid(){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const n = cellCount();
  for (let i=0;i<n;i++){
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('aria-label', `Quadrado ${i+1}`);
    btn.addEventListener('click', ()=> pick(i));
    grid.appendChild(btn);
  }
  grid.tabIndex = 0;
  grid.addEventListener('keydown', onGridKey);
  state.focused = 0;
  focusIndex(0);
}

function onGridKey(e){
  const size = gridSize();
  let i = state.focused;
  if (e.key === 'ArrowRight'){ e.preventDefault(); i = (i+1)%cellCount(); }
  else if (e.key === 'ArrowLeft'){ e.preventDefault(); i = (i-1+cellCount())%cellCount(); }
  else if (e.key === 'ArrowDown'){ e.preventDefault(); i = (i+size)%cellCount(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); i = (i-size+cellCount())%cellCount(); }
  else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(i); return; }
  else return;
  focusIndex(i);
}

function focusIndex(i){
  state.focused = i;
  const grid = document.getElementById('grid');
  const cell = grid.children[i];
  if (cell) cell.focus();
}

async function pick(i){
  if (!state.canPick) return;
  state.canPick = false;
  const rt = Math.max(0, Math.round(performance.now() - state.startTs));
  const correct = i === state.targetIndex;
  const grid = document.getElementById('grid');
  const cells = [...grid.children];
  if (correct){
    const toyUrl = ASSETS.toys[Math.floor(Math.random()*ASSETS.toys.length)];
    cells[i].style.backgroundImage = `url(${toyUrl})`;
    cells[i].classList.add('correct');
  } else {
    cells[i].classList.add('wrong');
  }
  hideHandHint();
  try{
    if (state.sessionId){
      await supabase.logEvent(state.sessionId, Date.now(), {
        level: state.level,
        targetIndex: state.targetIndex,
        guessIndex: i,
        correct,
        reactionTimeMs: rt,
      });
    }
  }catch(err){ /* noop */ }

  // Ajuste de nível
  const prevSize = gridSize();
  if (correct && state.level < 3) state.level++;
  if (!correct && state.level > 1) state.level--;

  await sleep(600);

  if (state.round >= state.maxRounds){
    await endGame();
  } else {
    // reconstruir grid se mudou o tamanho
    const newSize = gridSize();
    if (newSize !== prevSize){
      state.size = newSize;
      document.querySelector('main').innerHTML = pageTemplate();
      buildGrid();
    }
    updateHeader();
    await playRound();
  }
}

async function endGame(){
  try{ if (state.sessionId) await supabase.endSession(state.sessionId); }catch(e){}
  window.a11yAnnounce('Sessão finalizada');
  if (state.demo){
    window.mascot.say('Gostou? Cadastre-se para jogar mais e salvar seu progresso!');
  } else {
    window.mascot.say('Muito bem! Você terminou a sessão.');
  }
}

async function start(){
  const user = supabase.getCurrentUser();
  state.demo = !user;
  state.maxRounds = state.demo ? 3 : 10;
  document.getElementById('app').innerHTML = pageTemplate();
  document.getElementById('max').textContent = state.maxRounds;
  state.size = gridSize();
  buildGrid();
  try{
    const childId = supabase.getActiveChild();
    const sess = await supabase.startSession({ gameId:'onde-esta-o-brinquedo', childId });
    state.sessionId = sess.id;
  }catch(e){ state.sessionId = null; }
  await playRound();
}

export default {
  template(){ return pageTemplate(); },
  async init(){
    state.level = 1; state.round = 0; state.targetIndex=-1; state.canPick=false;
    await start();
    window.addEventListener('beforeunload', ()=>{ if (state.sessionId) supabase.endSession(state.sessionId); }, { once:true });
  }
};

// Lottie hand hint
let handAnim = null;
const HAND_URL = 'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/ok5fryn6t39e/Click_hand2.json';
function showHandHint(){
  const wrap = document.getElementById('grid-wrap');
  const grid = document.getElementById('grid');
  const hint = document.getElementById('hand-hint');
  if (!wrap || !grid || !hint) return;
  const cells = [...grid.children];
  const idx = Math.floor(Math.random()*cells.length);
  const rectWrap = wrap.getBoundingClientRect();
  const rect = cells[idx].getBoundingClientRect();
  const x = rect.left - rectWrap.left + rect.width*0.4;
  const y = rect.top - rectWrap.top + rect.height*0.4;
  hint.style.left = `${x}px`;
  hint.style.top = `${y}px`;
  hint.style.width = `${Math.max(60, rect.width*0.4)}px`;
  hint.style.height = `${Math.max(60, rect.height*0.4)}px`;
  hint.style.display = 'block';
  if (window.lottie){
    if (!handAnim){
      handAnim = window.lottie.loadAnimation({ container: hint, renderer: 'svg', loop: true, autoplay: true, path: HAND_URL });
    } else {
      handAnim.setDirection(1); handAnim.play();
    }
  }
  const stop = ()=> hideHandHint();
  grid.addEventListener('click', stop, { once:true, capture:true });
  grid.addEventListener('keydown', stop, { once:true, capture:true });
}
function hideHandHint(){
  const hint = document.getElementById('hand-hint');
  if (hint) hint.style.display = 'none';
  if (handAnim){ handAnim.stop(); }
}
