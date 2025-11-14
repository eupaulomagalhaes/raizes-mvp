import { supabase } from '../supabase.js';

const ASSETS = {
  toys: [
    'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/girafa.png',
    'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/robo.png',
    'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/dinossauro.png',
  ],
  box: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_01.png',
};

const PHASES = {
  INTRO: 'intro',
  SHOW_TOY: 'show-toy',
  HIDE_AND_ASK: 'hide-and-ask',
};

const state = {
  level: 1, // 1 => 1 caixa, 2 => 2 caixas, 3 => 3 caixas
  round: 0,
  maxRounds: 9,
  sessionId: null,
  phase: PHASES.INTRO,
  toyUrl: '',
  boxCount: 1,
  correctIndex: 0,
  canPick: false,
  startTs: 0,
  demo: false,
  introTimeout: null,
  showToyTimeout: null,
  handTimeout: null,
};

function pageTemplate(){
  return `
    <main class="game-room-screen bg-room" aria-label="Jogo Onde está o brinquedo">
      <div class="game-room-wrapper">
        <header class="game-room-header">
          <div class="game-room-mascot">
            <div class="game-room-avatar">
              <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/cabeca.png" alt="Mascote Don" />
            </div>
            <div class="speech game-room-speech" id="game-speech">Esse é o jogo: ONDE ESTÁ O BRINQUEDO</div>
          </div>
          <button class="game-room-menu" type="button" aria-label="Abrir menu do jogo">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>
        <div class="game-room-body">
          <div class="game-room-stage" id="game-stage">
            <img id="game-toy" class="game-room-toy" alt="Brinquedo" />
            <div id="game-boxes" class="game-room-boxes"></div>
            <div id="hand-hint" aria-hidden="true" class="game-room-hand"></div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function boxCountForLevel(level){
  return Math.min(3, Math.max(1, level));
}

function setSpeech(text){
  const el = document.getElementById('game-speech');
  if (el) el.textContent = text;
}

function renderScene(){
  const stage = document.getElementById('game-stage');
  const toy = document.getElementById('game-toy');
  const boxesWrap = document.getElementById('game-boxes');
  if (!stage || !toy || !boxesWrap) return;

  boxesWrap.innerHTML = '';
  toy.style.display = 'none';

  if (state.phase === PHASES.INTRO){
    // nada na área central, só fala
  } else if (state.phase === PHASES.SHOW_TOY){
    toy.src = state.toyUrl;
    toy.style.display = 'block';
  } else if (state.phase === PHASES.HIDE_AND_ASK){
    const count = state.boxCount;
    for (let i=0;i<count;i++){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'game-room-box';
      btn.setAttribute('aria-label', `Caixa ${i+1}`);
      btn.addEventListener('click', ()=> pickBox(i));
      const img = document.createElement('img');
      img.src = ASSETS.box;
      img.alt = 'Caixa misteriosa';
      btn.appendChild(img);
      boxesWrap.appendChild(btn);
    }
  }
}

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

async function pickBox(index){
  if (!state.canPick || state.phase !== PHASES.HIDE_AND_ASK) return;
  state.canPick = false;
  clearTimeout(state.handTimeout);
  hideHandHint();

  const rt = Math.max(0, Math.round(performance.now() - state.startTs));
  const correct = index === state.correctIndex;

  // Revela brinquedo na caixa escolhida
  const boxesWrap = document.getElementById('game-boxes');
  const boxes = boxesWrap ? [...boxesWrap.children] : [];
  if (boxes[index]){
    const img = boxes[index].querySelector('img');
    if (img) img.src = state.toyUrl;
    boxes[index].classList.add(correct ? 'game-box-correct' : 'game-box-wrong');
  }

  try{
    if (state.sessionId){
      await supabase.logEvent(state.sessionId, Date.now(), {
        level: state.level,
        targetIndex: state.correctIndex,
        guessIndex: index,
        correct,
        reactionTimeMs: rt,
      });
    }
  }catch(err){ /* noop */ }

  await sleep(800);

  // simples: avança nível até 3, depois mantém
  if (correct && state.level < 3){
    state.level++;
  }

  state.round++;
  if (state.round >= state.maxRounds){
    await endGame();
  } else {
    await startLevel();
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
  state.maxRounds = state.demo ? 3 : 9;
  document.getElementById('app').innerHTML = pageTemplate();
  renderScene();
  try{
    const childId = supabase.getActiveChild();
    const sess = await supabase.startSession({ gameId:'onde-esta-o-brinquedo', childId });
    state.sessionId = sess.id;
  }catch(e){ state.sessionId = null; }
  setupIntroFlow();
}

export default {
  template(){ return pageTemplate(); },
  async init(){
    state.level = 1; state.round = 0; state.phase = PHASES.INTRO; state.canPick=false;
    await start();
    window.addEventListener('beforeunload', ()=>{ if (state.sessionId) supabase.endSession(state.sessionId); }, { once:true });
  }
};

// fluxos de cena
function setupIntroFlow(){
  state.phase = PHASES.INTRO;
  setSpeech('Esse é o jogo: ONDE ESTÁ O BRINQUEDO');
  renderScene();
  const stage = document.getElementById('game-stage');
  if (!stage) return;
  const startLevelOnce = ()=>{
    stage.removeEventListener('click', startLevelOnce);
    startLevel();
  };
  stage.addEventListener('click', startLevelOnce);
}

async function startLevel(){
  clearTimeout(state.showToyTimeout);
  clearTimeout(state.handTimeout);
  hideHandHint();

  state.toyUrl = ASSETS.toys[Math.floor(Math.random()*ASSETS.toys.length)];
  state.boxCount = boxCountForLevel(state.level);
  state.correctIndex = Math.floor(Math.random()*state.boxCount);

  state.phase = PHASES.SHOW_TOY;
  setSpeech('Olhe bem para esse brinquedo!');
  renderScene();

  const stage = document.getElementById('game-stage');
  if (!stage) return;

  const advance = ()=>{
    stage.removeEventListener('click', advance);
    showBoxesAndAsk();
  };
  stage.addEventListener('click', advance);

  state.showToyTimeout = setTimeout(advance, 5000);
}

function showBoxesAndAsk(){
  clearTimeout(state.showToyTimeout);
  hideHandHint();

  state.phase = PHASES.HIDE_AND_ASK;
  setSpeech('ONDE ESTÁ O BRINQUEDO?');
  state.canPick = true;
  state.startTs = performance.now();
  renderScene();

  // mão após 10s
  state.handTimeout = setTimeout(()=>{
    showHandHint();
  }, 10000);
}

// Lottie hand hint
let handAnim = null;
const HAND_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/Click_hand2.json';
function showHandHint(){
  const boxesWrap = document.getElementById('game-boxes');
  const hint = document.getElementById('hand-hint');
  if (!boxesWrap || !hint) return;
  const boxes = [...boxesWrap.children];
  if (!boxes.length) return;
  const idx = state.correctIndex < boxes.length ? state.correctIndex : 0;
  const rectWrap = boxesWrap.getBoundingClientRect();
  const rect = boxes[idx].getBoundingClientRect();
  const x = rect.left - rectWrap.left + rect.width*0.25;
  const y = rect.top - rectWrap.top + rect.height*0.1;
  hint.style.left = `${x}px`;
  hint.style.top = `${y}px`;
  hint.style.width = `${Math.max(80, rect.width*0.6)}px`;
  hint.style.height = `${Math.max(80, rect.height*0.6)}px`;
  hint.style.display = 'block';
  if (window.lottie){
    if (!handAnim){
      handAnim = window.lottie.loadAnimation({ container: hint, renderer: 'svg', loop: true, autoplay: true, path: HAND_URL });
    } else {
      handAnim.setDirection(1); handAnim.play();
    }
  }
}
function hideHandHint(){
  const hint = document.getElementById('hand-hint');
  if (hint) hint.style.display = 'none';
  if (handAnim){ handAnim.stop(); }
}
