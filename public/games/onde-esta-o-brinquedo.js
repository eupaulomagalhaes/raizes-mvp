import { supabase } from '../supabase.js';

const ASSETS = {
  // Sequência fixa: Girafa (1 caixa) → Robô (2 caixas) → Dinossauro (3 caixas)
  toys: [
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/girafa.png', name: 'girafa', article: 'a', intro: 'Olha uma girafa!' },
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/robo.png', name: 'robô', article: 'o', intro: 'Este é um robô.' },
    { url: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/dinossauro.png', name: 'dinossauro', article: 'o', intro: 'Agora vemos um dinossauro!' },
  ],
  box: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_01.png',
  boxEmpty: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_empty.png',
  celebration: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/confetti.json',
  celebrationSound: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/audios/celebration.mp3',
};

const PHASES = {
  INTRO: 'intro',
  SHOW_TOY: 'show-toy',
  HIDE_AND_ASK: 'hide-and-ask',
};

const state = {
  level: 1, // 1 => 1 caixa (girafa), 2 => 2 caixas (robô), 3 => 3 caixas (dinossauro)
  round: 0,
  maxRounds: 3, // Apenas 3 fases fixas
  sessionId: null,
  phase: PHASES.INTRO,
  toyUrl: '',
  toyName: '',
  toyArticle: '',
  toyIntro: '',
  boxCount: 1,
  correctIndex: 0,
  canPick: false,
  startTs: 0,
  demo: false,
  introTimeout: null,
  showToyTimeout: null,
  handTimeout: null,
  correctCount: 0,
  attempts: 0,
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
            <div id="celebration-container" class="game-celebration" style="display:none;"></div>
            <button id="btn-next-level" class="btn" data-variant="primary" style="display:none; margin-top: 20px; z-index: 1000; position: relative;">Próximo Nível</button>
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

// Som de comemoração
let celebrationAudio = null;
function playCelebrationSound(){
  try {
    if (!celebrationAudio){
      celebrationAudio = new Audio(ASSETS.celebrationSound);
      celebrationAudio.volume = 0.5;
    }
    celebrationAudio.currentTime = 0;
    celebrationAudio.play().catch(()=>{});
  } catch(e){}
}

// Comemoração com confetti/balões
let celebrationAnim = null;
function showCelebration(){
  const container = document.getElementById('celebration-container');
  if (!container) return;
  
  // Limpa conteúdo anterior
  container.innerHTML = '';
  container.style.display = 'block';
  
  // Tenta usar Lottie se disponível
  if (window.lottie){
    try {
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
      return;
    } catch(e){ /* fallback */ }
  }
  
  // Fallback: animação CSS com emojis
  const emojis = ['🎉', '⭐', '🎈', '🌟', '✨', '🎊', '💫', '🏆'];
  for (let i = 0; i < 20; i++){
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.fontSize = `${1.5 + Math.random() * 1.5}rem`;
    container.appendChild(particle);
  }
  
  // Remove após animação
  setTimeout(()=>{
    container.style.display = 'none';
    container.innerHTML = '';
  }, 2000);
}

function hideCelebration(){
  const container = document.getElementById('celebration-container');
  if (container){
    container.style.display = 'none';
    container.innerHTML = '';
  }
  if (celebrationAnim){
    try { celebrationAnim.stop(); } catch(e){}
  }
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
  
  const boxesWrap = document.getElementById('game-boxes');
  const boxes = boxesWrap ? [...boxesWrap.children] : [];
  const clickedBox = boxes[index];
  
  // Se a caixa já foi clicada (está aberta/vazia), ignora
  if (clickedBox?.classList.contains('box-opened')) return;
  
  clearTimeout(state.handTimeout);
  hideHandHint();

  const rt = Math.max(0, Math.round(performance.now() - state.startTs));
  const correct = index === state.correctIndex;

  if (correct){
    // ACERTOU! Comemoração
    state.canPick = false;
    state.correctCount++;
    
    // Revela o brinquedo na caixa correta
    if (clickedBox){
      const img = clickedBox.querySelector('img');
      if (img) img.src = state.toyUrl;
      clickedBox.classList.add('game-box-correct');
    }
    
    // Som e animação de comemoração
    playCelebrationSound();
    showCelebration();
    setSpeech('MUITO BEM! 🎉');
    speak('Muito bem! Você encontrou!');
    
    // Log do acerto
    try{
      if (state.sessionId){
        await supabase.logEvent(state.sessionId, Date.now(), {
          level: state.boxCount,
          targetIndex: state.correctIndex,
          guessIndex: index,
          correct: true,
          reactionTimeMs: rt,
          attempts: state.attempts || 1,
          toy: state.toyName,
        });
      }
    }catch(err){ /* noop */ }
    
    // Aguardar 2s e então mostrar botão "Próximo Nível"
    await sleep(2000);
    hideCelebration();
    
    // Mostrar botão para avançar
    const btnNext = document.getElementById('btn-next-level');
    if (btnNext){
      btnNext.style.display = 'block';
      btnNext.onclick = async () => {
        btnNext.style.display = 'none';
        state.round++;
        if (state.round >= state.maxRounds){
          await endGame();
        } else {
          await startLevel();
        }
      };
    }
    
  } else {
    // ERROU - abre a caixa vazia
    state.attempts = (state.attempts || 0) + 1;
    
    // Mostra caixa vazia (aberta)
    if (clickedBox){
      const img = clickedBox.querySelector('img');
      // Usa imagem de caixa vazia ou apenas escurece
      clickedBox.classList.add('box-opened');
      clickedBox.style.opacity = '0.4';
      clickedBox.style.pointerEvents = 'none';
    }
    
    // Permite tentar novamente nas outras caixas (níveis 2 e 3)
    if (state.boxCount > 1){
      const remainingBoxes = boxes.filter(b => !b.classList.contains('box-opened'));
      
      if (remainingBoxes.length > 1){
        // Ainda há mais de uma caixa, pode tentar de novo
        setSpeech('Ops! Tente outra caixa!');
        speak('Tente outra caixa!');
        return; // Não avança rodada ainda
      } else if (remainingBoxes.length === 1){
        // Última caixa restante - deixa a criança clicar nela
        setSpeech('Só resta uma! Clique nela!');
        speak('Só resta uma caixa!');
        return;
      }
    }
    
    // Nível 1 (1 caixa): revela onde estava
    state.canPick = false;
    setSpeech('Ops! Veja onde estava!');
    speak('Veja onde estava o brinquedo!');
    
    // Revela a caixa correta
    if (boxes[state.correctIndex]){
      const correctImg = boxes[state.correctIndex].querySelector('img');
      if (correctImg) correctImg.src = state.toyUrl;
      boxes[state.correctIndex].classList.add('game-box-correct');
    }
    
    // Log do erro final
    try{
      if (state.sessionId){
        await supabase.logEvent(state.sessionId, Date.now(), {
          level: state.level,
          targetIndex: state.correctIndex,
          guessIndex: index,
          correct: false,
          reactionTimeMs: rt,
          attempts: state.attempts,
        });
      }
    }catch(err){ /* noop */ }
    
    await sleep(2500);
    hideHandHint();
    
    state.round++;
    if (state.round >= state.maxRounds){
      await endGame();
    } else {
      await startLevel();
    }
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
    title.textContent = 'Parabéns! 🎉';
    message.textContent = `Você completou todas as ${state.maxRounds} fases da atividade!`;
    
    // Explicação cognitiva e dicas para os pais
    tipText.innerHTML = `
      <strong>🧠 O que trabalhamos nesta atividade:</strong><br>
      • <strong>Atenção e Foco:</strong> A criança precisa prestar atenção ao brinquedo e às caixas.<br>
      • <strong>Memória Visual:</strong> Lembrar onde viu o brinquedo pela última vez.<br>
      • <strong>Permanência do Objeto:</strong> Entender que objetos continuam existindo mesmo quando não visíveis.<br>
      • <strong>Tomada de Decisão:</strong> Escolher uma caixa e aprender com acertos e erros.<br>
      • <strong>Coordenação Motora Fina:</strong> Tocar na caixa pratica movimentos de precisão.<br><br>
      
      <strong>🏠 Sugestão prática para casa:</strong><br>
      Esconda um brinquedo dentro de caixas, copos ou paninhos. Peça para a criança encontrar. 
      Celebre quando ela acertar! Se errar, incentive com calma: "Tente novamente!"<br><br>
      
      <strong>💡 Por que é importante:</strong><br>
      Esse tipo de brincadeira simples fortalece o cérebro da criança de forma divertida e afetuosa, 
      desenvolvendo habilidades essenciais para a aprendizagem futura.
    `;
    
    modal.style.display = 'flex';
    speak('Parabéns! Você completou todas as fases!');
    
    playAgainBtn?.addEventListener('click', ()=>{
      modal.style.display = 'none';
      state.round = 0;
      state.correctCount = 0;
      state.attempts = 0;
      state.phase = PHASES.INTRO;
      setupIntroFlow();
    }, { once: true });
  }
}

async function start(){
  const user = supabase.getCurrentUser();
  state.demo = !user;
  state.maxRounds = 3; // Sempre 3 fases: Girafa, Robô, Dinossauro
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

  // Reset tentativas para nova rodada
  state.attempts = 0;

  // Sequência fixa: round 0 = girafa (1 caixa), round 1 = robô (2 caixas), round 2 = dinossauro (3 caixas)
  const toyIndex = Math.min(state.round, ASSETS.toys.length - 1);
  const toy = ASSETS.toys[toyIndex];
  state.toyUrl = toy.url;
  state.toyName = toy.name;
  state.toyArticle = toy.article;
  state.toyIntro = toy.intro;
  state.boxCount = toyIndex + 1; // 1, 2, 3 caixas
  state.correctIndex = Math.floor(Math.random() * state.boxCount);

  state.phase = PHASES.SHOW_TOY;
  setSpeech(state.toyIntro.toUpperCase());
  renderScene();
  
  // Falar a introdução do brinquedo via TTS
  speak(state.toyIntro);

  const stage = document.getElementById('game-stage');
  if (!stage) return;

  const advance = ()=>{
    stage.removeEventListener('click', advance);
    showBoxesAndAsk();
  };
  stage.addEventListener('click', advance);

  state.showToyTimeout = setTimeout(advance, 4000);
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
}

// Funções de hand hint removidas - não são mais usadas
function showHandHint(){}
function hideHandHint(){}
