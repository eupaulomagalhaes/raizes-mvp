import { UI } from '../components/ui.js';
import { supabase } from '../supabase.js';

function tpl(){
  return `
    <main class='progress-screen'>
      <div class='progress-header'>
        <h1 class='h1'>Progresso</h1>
        <a class='btn' data-variant='ghost' href='#/games'>Voltar</a>
      </div>
      ${UI.Card(`
        <div class='progress-content'>
          <div id='auth-hint' class='text-[var(--text-secondary)]'></div>
          <div id='child-picker' class='hidden'></div>
          <div id='metrics' class='progress-metrics'></div>
          <div class='progress-chart-container'>
            <canvas id='chart' width='600' height='280' class='w-full'></canvas>
          </div>
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
    const progressByDay = await supabase.getGameProgressByDay({ childId, gameId: 'onde-esta-o-brinquedo' });
    const tempoSegundos = gp.avgReactionMs ? (gp.avgReactionMs / 1000).toFixed(1) : (gp.avgReaction / 1000).toFixed(1);
    metrics.innerHTML = `
      <!-- Linha 1: Sessões | Tentativas -->
      <div class='progress-metric-card'>
        <div class='h3'>Sessões</div>
        <div class='text-2xl font-extrabold'>${gp.sessions}</div>
      </div>
      <div class='progress-metric-card'>
        <div class='h3'>Tentativas</div>
        <div class='text-2xl font-extrabold'>${gp.totalAttempts || 0}</div>
      </div>
      <!-- Linha 2: Acertos | Erros -->
      <div class='progress-metric-card'>
        <div class='h3'>Acertos</div>
        <div class='text-2xl font-extrabold'>${gp.totalCorrect || 0}</div>
      </div>
      <div class='progress-metric-card'>
        <div class='h3'>Erros</div>
        <div class='text-2xl font-extrabold'>${gp.totalErrors || 0}</div>
      </div>
      <!-- Linha 3: Acerto Médio | Tempo Médio de Reação -->
      <div class='progress-metric-card'>
        <div class='h3'>Acerto médio</div>
        <div class='text-2xl font-extrabold'>${(gp.accuracy*100).toFixed(0)}%</div>
      </div>
      <div class='progress-metric-card'>
        <div class='h3'>Tempo médio reação</div>
        <div class='text-2xl font-extrabold'>${tempoSegundos} s</div>
      </div>
      <!-- Linha 4: Nível Médio (sozinho) -->
      <div class='progress-metric-card progress-metric-full'>
        <div class='h3'>Nível médio</div>
        <div class='text-2xl font-extrabold'>${gp.avgLevel.toFixed(1)}</div>
      </div>
    `;
    drawChart(document.getElementById('chart'), gp, progressByDay);
  }

  document.getElementById(selectId).addEventListener('change', update);
  await update();
}

function drawChart(canvas, gp, progressByDay = []){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  if (!progressByDay || progressByDay.length === 0){
    // Se não há dados por dia, mostrar gráfico simples
    const labels = ['Sessões','Acerto %','Reação s','Nível'];
    const avgReactionSec = gp.avgReactionMs ? (gp.avgReactionMs / 1000) : (gp.avgReaction / 1000);
    const values = [gp.sessions, gp.accuracy*100, avgReactionSec, gp.avgLevel];
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
    return;
  }
  
  // Gráfico de evolução por dia
  const w = canvas.width, h = canvas.height, pad = 50;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  
  // Formatar datas para exibição
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };
  
  // Preparar dados - usar acurácia como métrica principal
  const accuracyData = progressByDay.map(d => d.accuracy * 100);
  const maxAccuracy = Math.max(100, ...accuracyData, 1);
  const minAccuracy = Math.min(...accuracyData, 0);
  const range = maxAccuracy - minAccuracy || 100;
  
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#3a5144';
  ctx.strokeStyle = '#234c38';
  
  // Desenhar eixos
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
  
  // Desenhar escala do eixo Y (acurácia %)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#666';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++){
    const y = pad + (chartH / ySteps) * (ySteps - i);
    const value = minAccuracy + (range / ySteps) * i;
    ctx.fillText(Math.round(value) + '%', pad - 8, y + 4);
    // Linha de grade
    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    ctx.strokeStyle = '#234c38';
  }
  
  // Desenhar linha de evolução
  ctx.strokeStyle = '#234c38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  const pointSpacing = chartW / Math.max(1, progressByDay.length - 1);
  
  progressByDay.forEach((day, i) => {
    const x = pad + (i * pointSpacing);
    const accuracy = day.accuracy * 100;
    const y = pad + chartH - ((accuracy - minAccuracy) / range) * chartH;
    
    if (i === 0){
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Desenhar pontos
  ctx.fillStyle = '#234c38';
  progressByDay.forEach((day, i) => {
    const x = pad + (i * pointSpacing);
    const accuracy = day.accuracy * 100;
    const y = pad + chartH - ((accuracy - minAccuracy) / range) * chartH;
    
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mostrar valor no primeiro e último dia
    if (i === 0 || i === progressByDay.length - 1){
      ctx.fillStyle = '#234c38';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(accuracy) + '%', x, y - 12);
      ctx.fillStyle = '#234c38';
    }
  });
  
  // Desenhar labels do eixo X (datas)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.font = '10px Inter, sans-serif';
  
  // Mostrar primeiro dia, último dia e alguns intermediários
  const labelIndices = [];
  if (progressByDay.length > 0) labelIndices.push(0);
  if (progressByDay.length > 1) labelIndices.push(progressByDay.length - 1);
  if (progressByDay.length > 2) {
    const mid = Math.floor(progressByDay.length / 2);
    if (!labelIndices.includes(mid)) labelIndices.push(mid);
  }
  
  labelIndices.forEach(i => {
    const x = pad + (i * pointSpacing);
    const dateStr = formatDate(progressByDay[i].date);
    ctx.fillText(dateStr, x, h - pad + 20);
    
    // Marca no eixo
    ctx.strokeStyle = '#234c38';
    ctx.beginPath();
    ctx.moveTo(x, h - pad);
    ctx.lineTo(x, h - pad + 5);
    ctx.stroke();
  });
  
  // Título do gráfico
  ctx.fillStyle = '#1b2b21';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Evolução da Acurácia (%)', w / 2, pad - 10);
  
  // Legenda
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'left';
  if (progressByDay.length > 0){
    const firstDay = formatDate(progressByDay[0].date);
    const lastDay = formatDate(progressByDay[progressByDay.length - 1].date);
    ctx.fillText(`Primeiro dia: ${firstDay} → Último dia: ${lastDay}`, pad, h - pad + 40);
  }
}

export default {
  template(){ return tpl(); },
  init(){ draw(); }
};
