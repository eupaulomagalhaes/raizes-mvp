import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

function tpl(){
  return `
    <main class='space-y-6'>
      <div class='flex items-center justify-between'>
        <h1 class='h1'>Progresso</h1>
        <a class='btn' data-variant='ghost' href='#/games'>Voltar</a>
      </div>
      ${UI.Card(`
        <div class='space-y-4'>
          <div id='auth-hint' class='text-[var(--text-secondary)]'></div>
          <div id='child-picker' class='hidden'></div>
          <div id='metrics' class='grid gap-3 md:grid-cols-2'></div>
          <canvas id='chart' width='600' height='280' class='w-full'></canvas>
        </div>
      `)}
    </main>
  `;
}

async function draw(){
  const user = supabase.getCurrentUser();
  const hint = document.getElementById('auth-hint');
  const picker = document.getElementById('child-picker');
  const metrics = document.getElementById('metrics');

  if (!user){
    hint.innerHTML = `Você está no modo convidado. <a class='btn' data-variant='primary' href='#/register'>Cadastre-se</a> para salvar e ver progresso.`;
    return;
  }
  hint.textContent = '';

  const children = await supabase.listChildren();
  if (!children.length){
    metrics.innerHTML = `<p class='text-[var(--text-secondary)]'>Nenhuma criança cadastrada ainda.</p>`;
    return;
  }

  picker.classList.remove('hidden');
  const selectId = 'child-select';
  picker.innerHTML = UI.Select({ id: selectId, label: 'Selecione a criança', required: true, options: children.map(c=>({ value: c.id, label: c.name })) });

  async function update(){
    const childId = document.getElementById(selectId).value;
    const gp = await supabase.getGameProgress({ childId, gameId: 'onde-esta-o-brinquedo' });
    const tempoSegundos = (gp.avgReaction / 1000).toFixed(1);
    metrics.innerHTML = `
      <div class='card p-4'>
        <div class='h3'>Sessões</div>
        <div class='text-2xl font-extrabold'>${gp.sessions}</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Acertos</div>
        <div class='text-2xl font-extrabold'>${gp.totalCorrect || 0}</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Erros</div>
        <div class='text-2xl font-extrabold'>${gp.totalErrors || 0}</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Tentativas</div>
        <div class='text-2xl font-extrabold'>${gp.totalAttempts || 0}</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Acerto médio</div>
        <div class='text-2xl font-extrabold'>${(gp.accuracy*100).toFixed(0)}%</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Tempo médio reação</div>
        <div class='text-2xl font-extrabold'>${tempoSegundos} s</div>
      </div>
      <div class='card p-4'>
        <div class='h3'>Nível médio</div>
        <div class='text-2xl font-extrabold'>${gp.avgLevel.toFixed(1)}</div>
      </div>
    `;
    drawChart(document.getElementById('chart'), gp);
  }

  document.getElementById(selectId).addEventListener('change', update);
  await update();
}

function drawChart(canvas, gp){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const labels = ['Sessões','Acerto %','Reação s','Nível'];
  const values = [gp.sessions, gp.accuracy*100, (gp.avgReaction/1000), gp.avgLevel];
  const max = Math.max(1, ...values);
  const w = canvas.width, h = canvas.height, pad=40;
  const barW = (w - pad*2) / values.length * 0.6;
  ctx.font = '14px Poppins, sans-serif';
  ctx.fillStyle = '#3a5144';
  ctx.strokeStyle = '#234c38';

  // axes
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h-pad);
  ctx.lineTo(w-pad, h-pad);
  ctx.stroke();

  values.forEach((v, i)=>{
    const x = pad + (i+0.5)*((w - pad*2)/values.length) - barW/2;
    const y = h - pad;
    const bh = (v/max) * (h - pad*2);
    // bar
    const grad = ctx.createLinearGradient(0, y-bh, 0, y);
    grad.addColorStop(0, '#234c38');
    grad.addColorStop(1, '#f0a500');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y-bh, barW, bh);
    // label
    ctx.fillStyle = '#1b2b21';
    ctx.fillText(labels[i], x, y+18);
  });
}

export default {
  template(){ return tpl(); },
  init(){ draw(); }
};
