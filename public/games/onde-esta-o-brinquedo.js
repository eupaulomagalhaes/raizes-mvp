import { supabase } from '../supabase.js';

const ASSETS = {
  toys: [
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/girafa.png', name: 'girafa', article: 'a' },
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/robo.png', name: 'robô', article: 'o' },
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/dinossauro.png', name: 'dinossauro', article: 'o' },
  ],
  box: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_01.png',
  celebration: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/confetti.json',
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
  toyName: '',
  toyArticle: '',
  boxCount: 1,
  correctIndex: 0,
  canPick: false,
  startTs: 0,
  demo: false,
  introTimeout: null,
  showToyTimeout: null,
  handTimeout: null,
  correctCount: 0,
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
            <div id="celebration-container" class="game-celebration" style="display:none;"></div>
          </div>
        </div>
      </div>
      <div id="game-end-modal" class="game-end-modal" style="display:none;">
        <div class="game-end-content">
          <div class="game-end-header">
            <img src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/cabeca.png" alt="Don" class="game-end-avatar" />
            <h2 id="game-end-title">Parabéns!</h2>
          </div>
          <p id="game-end-message"></p>
          <div class="game-end-tip">
            <h3>💡 Dica para os pais:</h3>
            <p id="game-end-tip-text"></p>
          </div>
          <div class="game-end-actions">
            <button class="btn" data-variant="primary" id="btn-play-again">Jogar novamente</button>
            <a class="btn" data-variant="ghost" href="#/games">Voltar aos jogos</a>
          </div>
        </div>
      </div>
    </main>
  `;
}

function boxCountForLevel(level){
  return Math.min(3, Math.max(1, level));
}

// Text-to-Speech para dar voz ao mascote
function speak(text){
  if (!('speechSynthesis' in window)) return;
  // Cancela fala anterior
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  // Tenta usar voz brasileira se disponível
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) utterance.voice = ptVoice;
  window.speechSynthesis.speak(utterance);
}

// Comemoração com confetti
let celebrationAnim = null;
function showCelebration(){
  const container = document.getElementById('celebration-container');
  if (!container) return;
  container.style.display = 'block';
  if (window.lottie && !celebrationAnim){
    celebrationAnim = window.lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: ASSETS.celebration
    });
    celebrationAnim.addEventListener('complete', ()=>{
      container.style.display = 'none';
    });
  } else if (celebrationAnim){
    celebrationAnim.goToAndPlay(0);
    container.style.display = 'block';
  }
}

function hideCelebration(){
  const container = document.getElementById('celebration-container');
  if (container) container.style.display = 'none';
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

  if (correct){
    // Comemoração ao acertar
    state.correctCount++;
    showCelebration();
    setSpeech('MUITO BEM! 🎉');
    speak('Muito bem! Você encontrou!');
  } else {
    // Mostra mão apontando para a caixa correta ao errar
    setSpeech('Ops! Tente de novo!');
    speak('Ops! Não era essa. Veja onde está!');
    // Revela a caixa correta
    if (boxes[state.correctIndex]){
      const correctImg = boxes[state.correctIndex].querySelector('img');
      if (correctImg) correctImg.src = state.toyUrl;
      boxes[state.correctIndex].classList.add('game-box-correct');
    }
    showHandHint();
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

  await sleep(correct ? 1500 : 2000);
  hideCelebration();
  hideHandHint();

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
  window.a11yAnnounce?.('Sessão finalizada');
  
  // Mostra modal de fim de jogo com sugestões para os pais
  const modal = document.getElementById('game-end-modal');
  const title = document.getElementById('game-end-title');
  const message = document.getElementById('game-end-message');
  const tipText = document.getElementById('game-end-tip-text');
  const playAgainBtn = document.getElementById('btn-play-again');
  
  if (modal){
    const percentage = Math.round((state.correctCount / state.maxRounds) * 100);
    
    if (state.demo){
      title.textContent = 'Gostou do jogo?';
      message.textContent = 'Cadastre-se para jogar mais e salvar o progresso do seu filho!';
    } else {
      title.textContent = percentage >= 70 ? 'Parabéns! 🎉' : 'Bom trabalho!';
      message.textContent = `Você acertou ${state.correctCount} de ${state.maxRounds} rodadas (${percentage}%)!`;
    }
    
    // Dica educacional para os pais
    tipText.innerHTML = `
      <strong>O que trabalhamos:</strong> Memória visual, atenção sustentada e permanência do objeto.<br><br>
      <strong>Atividade concreta:</strong> Em casa, esconda um brinquedo favorito sob um pano ou caixa enquanto a criança observa. 
      Pergunte "Onde está o(a) [nome do brinquedo]?" e incentive-a a encontrar. 
      Aumente gradualmente o número de esconderijos para desafiar a memória.<br><br>
      <strong>Por que é importante:</strong> Nomear objetos ajuda no desenvolvimento da linguagem e vocabulário. 
      A busca pelo objeto escondido fortalece a memória de trabalho e a compreensão de que objetos continuam existindo mesmo quando não os vemos.
    `;
    
    modal.style.display = 'flex';
    speak(state.demo ? 'Gostou do jogo? Cadastre-se para jogar mais!' : `Parabéns! Você acertou ${state.correctCount} de ${state.maxRounds}!`);
    
    playAgainBtn?.addEventListener('click', ()=>{
      modal.style.display = 'none';
      state.level = 1;
      state.round = 0;
      state.correctCount = 0;
      state.phase = PHASES.INTRO;
      setupIntroFlow();
    }, { once: true });
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
    state.level = 1; state.round = 0; state.phase = PHASES.INTRO; state.canPick=false; state.correctCount=0;
    // Carregar vozes do TTS
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    await start();
    window.addEventListener('beforeunload', ()=>{ if (state.sessionId) supabase.endSession(state.sessionId); }, { once:true });
  }
};

// fluxos de cena
function setupIntroFlow(){
  state.phase = PHASES.INTRO;
  setSpeech('Esse é o jogo: ONDE ESTÁ O BRINQUEDO');
  speak('Esse é o jogo: Onde está o brinquedo! Toque na tela para começar.');
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

  const toy = ASSETS.toys[Math.floor(Math.random()*ASSETS.toys.length)];
  state.toyUrl = toy.url;
  state.toyName = toy.name;
  state.toyArticle = toy.article;
  state.boxCount = boxCountForLevel(state.level);
  state.correctIndex = Math.floor(Math.random()*state.boxCount);

  state.phase = PHASES.SHOW_TOY;
  setSpeech(`Olhe bem! Ess${state.toyArticle === 'a' ? 'a' : 'e'} é ${state.toyArticle} ${state.toyName.toUpperCase()}!`);
  renderScene();
  
  // Falar o nome do brinquedo via TTS
  speak(`Olhe bem! ${state.toyArticle === 'a' ? 'Essa' : 'Esse'} é ${state.toyArticle} ${state.toyName}!`);

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
  const question = `ONDE ESTÁ ${state.toyArticle.toUpperCase()} ${state.toyName.toUpperCase()}?`;
  setSpeech(question);
  state.canPick = true;
  state.startTs = performance.now();
  renderScene();

  // Falar a pergunta via TTS
  speak(`Onde está ${state.toyArticle} ${state.toyName}?`);

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
