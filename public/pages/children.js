import { supabase } from '../supabase.js';

export default {
  template(){
    return `
      <main class="children-screen bg-app">
        <header class="children-header">
          <h1>Crianças</h1>
          <button class="btn-add-child" id="btn-add-child" aria-label="Adicionar criança">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
        </header>
        
        <div class="children-list" id="children-list">
          <div class="loading-spinner">Carregando...</div>
        </div>

        <!-- Modal adicionar criança -->
        <div class="modal-overlay" id="modal-add-child" style="display:none;">
          <div class="modal-content">
            <h2>Adicionar Criança</h2>
            <form id="form-add-child">
              <div class="form-group">
                <label for="child-name">Nome da criança</label>
                <input type="text" id="child-name" name="name" required placeholder="Ex: João" />
              </div>
              <div class="form-group">
                <label for="child-birthdate">Data de nascimento</label>
                <input type="date" id="child-birthdate" name="birthdate" required />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn" data-variant="ghost" id="btn-cancel-child">Cancelar</button>
                <button type="submit" class="btn" data-variant="primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal detalhes da criança -->
        <div class="modal-overlay" id="modal-child-details" style="display:none;">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h2 id="detail-child-name">Detalhes</h2>
              <button type="button" class="btn-close" id="btn-close-details" aria-label="Fechar">×</button>
            </div>
            <div class="child-stats" id="child-stats">
              <div class="loading-spinner">Carregando estatísticas...</div>
            </div>
            <div class="weekly-progress" id="weekly-progress">
              <h3>Evolução Semanal</h3>
              <div class="week-chart" id="week-chart"></div>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async init(){
    await loadChildren();
    
    // Botão adicionar
    document.getElementById('btn-add-child')?.addEventListener('click', ()=>{
      document.getElementById('modal-add-child').style.display = 'flex';
    });
    
    // Cancelar modal
    document.getElementById('btn-cancel-child')?.addEventListener('click', ()=>{
      document.getElementById('modal-add-child').style.display = 'none';
    });
    
    // Fechar detalhes
    document.getElementById('btn-close-details')?.addEventListener('click', ()=>{
      document.getElementById('modal-child-details').style.display = 'none';
    });
    
    // Form adicionar
    document.getElementById('form-add-child')?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('child-name').value.trim();
      const birthdate = document.getElementById('child-birthdate').value;
      
      if (!name || !birthdate) return;
      
      try {
        await supabase.addChild({ name, birthdate });
        document.getElementById('modal-add-child').style.display = 'none';
        document.getElementById('form-add-child').reset();
        await loadChildren();
      } catch(err){
        alert('Erro ao adicionar criança: ' + err.message);
      }
    });
    
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e)=>{
        if (e.target === modal) modal.style.display = 'none';
      });
    });
  }
};

async function loadChildren(){
  const list = document.getElementById('children-list');
  if (!list) return;
  
  try {
    const children = await supabase.listChildren();
    
    if (!children || children.length === 0){
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👶</div>
          <p>Nenhuma criança cadastrada</p>
          <p class="text-muted">Toque no + para adicionar</p>
        </div>
      `;
      return;
    }
    
    const activeChildId = supabase.getActiveChild();
    
    list.innerHTML = children.map(child => {
      const birthdate = child.birthdate || child.data_nascimento;
      const isActive = String(activeChildId) === String(child.id);
      
      return `
      <div class="child-card" data-child-id="${child.id}">
        <div class="child-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="4"/>
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
          </svg>
        </div>
        <div class="child-info">
          <h3>${child.name}</h3>
          <p class="child-age">${calculateAge(birthdate)}</p>
        </div>
        <div class="child-actions">
          <button class="btn-details" data-details-child="${child.id}" aria-label="Ver detalhes de ${child.name}" title="Ver estatísticas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9M13 17v-6M8 17v-3"/>
            </svg>
          </button>
          <button class="btn-select-child ${isActive ? 'active' : ''}" 
                  data-select-child="${child.id}" aria-label="Selecionar ${child.name}">
            ${isActive ? '✓' : 'Selecionar'}
          </button>
        </div>
      </div>
    `;
    }).join('');
    
    // Event listeners para botão de detalhes
    list.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const childId = btn.dataset.detailsChild;
        showChildDetails(childId);
      });
    });
    
    // Event listeners para selecionar
    list.querySelectorAll('.btn-select-child').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const childId = btn.dataset.selectChild;
        supabase.setActiveChild(childId);
        loadChildren();
      });
    });
    
  } catch(err){
    list.innerHTML = `<div class="error-state">Erro ao carregar: ${err.message}</div>`;
  }
}

function calculateAge(birthdate){
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0){
    years--;
    months += 12;
  }
  
  if (years > 0){
    return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
  }
  return `${months} mes${months > 1 ? 'es' : ''}`;
}

async function showChildDetails(childId){
  const modal = document.getElementById('modal-child-details');
  const nameEl = document.getElementById('detail-child-name');
  const statsEl = document.getElementById('child-stats');
  const chartEl = document.getElementById('week-chart');
  
  if (!modal) return;
  modal.style.display = 'flex';
  
  try {
    // Buscar dados da criança
    const children = await supabase.listChildren();
    const child = children.find(c => c.id === childId);
    if (child) nameEl.textContent = child.name;
    
    // Buscar estatísticas do jogo
    const stats = await supabase.getChildStats(childId);
    
    if (stats && stats.totalSessions > 0){
      // Converter ms para segundos
      const avgTimeSeconds = (stats.avgReactionTime / 1000).toFixed(1);
      
      statsEl.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalSessions}</div>
            <div class="stat-label">Sessões jogadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.accuracy}%</div>
            <div class="stat-label">Taxa de acerto</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgTimeSeconds}s</div>
            <div class="stat-label">Tempo médio</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.maxLevel}</div>
            <div class="stat-label">Nível máximo</div>
          </div>
        </div>
      `;
    } else {
      statsEl.innerHTML = `
        <div class="empty-state">
          <p>Ainda não há dados de jogos</p>
          <p class="text-muted">Jogue "Onde está o brinquedo" para ver estatísticas</p>
        </div>
      `;
    }
    
    // Gráfico semanal
    const weeklyData = await supabase.getWeeklyProgress(childId);
    renderWeekChart(chartEl, weeklyData);
    
  } catch(err){
    statsEl.innerHTML = `<div class="error-state">Erro: ${err.message}</div>`;
  }
}

function renderWeekChart(container, data){
  if (!container) return;
  
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  
  // Reorganiza para começar de hoje - 6 dias
  const orderedDays = [];
  for (let i = 6; i >= 0; i--){
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayIndex = date.getDay();
    
    // Formatar data como dd/mm
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    
    orderedDays.push({
      dayName: days[dayIndex],
      dateStr: `${dd}/${mm}`,
      value: data?.[dayIndex] || 0,
      isToday: i === 0
    });
  }
  
  const maxValue = Math.max(...orderedDays.map(d => d.value), 1);
  const totalSessions = orderedDays.reduce((sum, d) => sum + d.value, 0);
  const activeDays = orderedDays.filter(d => d.value > 0).length;
  
  container.innerHTML = `
    <div class="chart-summary">
      <div class="chart-summary-item">
        <span class="chart-summary-value">${totalSessions}</span>
        <span class="chart-summary-label">sessões na semana</span>
      </div>
      <div class="chart-summary-item">
        <span class="chart-summary-value">${activeDays}</span>
        <span class="chart-summary-label">dias ativos</span>
      </div>
    </div>
    <div class="chart-bars">
      ${orderedDays.map(day => `
        <div class="chart-bar-wrap ${day.value > 0 ? 'has-activity' : ''}">
          <div class="chart-bar" style="height: ${Math.max((day.value / maxValue) * 100, day.value > 0 ? 15 : 5)}%">
            <span class="chart-value">${day.value}</span>
          </div>
          <div class="chart-label-stack ${day.isToday ? 'today' : ''}">
            <span class="chart-date">${day.dateStr}</span>
            <span class="chart-day">${day.dayName}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <p class="chart-legend">Atividades realizadas nos últimos 7 dias</p>
  `;
}
