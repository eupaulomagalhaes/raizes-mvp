# 🔍 AUDITORIA DE MIGRAÇÃO - Raízes Educacional
**Legado (Vanilla JS + Supabase) → Next.js 15 + React + shadcn/ui**

---

## ✅ MIGRADO (Funcionalidades implementadas)

### 📄 Páginas Core
| Legado | Next.js 15 | Status |
|--------|-----------|---------|
| `pages/splash.js` | `app/page.tsx` (Welcome) | ✅ Migrado |
| `pages/welcome.js` | `app/page.tsx` | ✅ Migrado |
| `pages/login.js` | `app/login/page.tsx` | ✅ Migrado |
| `pages/register.js` | `app/register/page.tsx` | ✅ Migrado (5 etapas) |
| `pages/games.js` | `app/games/page.tsx` | ✅ Migrado |
| `pages/children.js` | `app/children/page.tsx` | ✅ Migrado |
| `pages/settings.js` | `app/settings/page.tsx` | ✅ Migrado |
| `pages/progress.js` | `app/progress/page.tsx` | ⚠️ PARCIAL (falta relatório dos pais) |

### 🎮 Jogos
| Legado | Next.js 15 | Status |
|--------|-----------|---------|
| `games/onde-esta-o-brinquedo.js` | `app/games/onde-esta-o-brinquedo/page.tsx` | ⚠️ PARCIAL (falta feedback dos pais) |

### 🗄️ Banco de Dados
| Legado | Supabase (UUID) | Status |
|--------|-----------------|---------|
| `usuarios` | ✅ Migrado | UUID, trigger automático |
| `criancas` | ✅ Migrado | UUID, RLS policies |
| `jogos` | ✅ Migrado | UUID, seed de jogos |
| `sessoes_jogo` | ✅ Migrado | UUID |
| `eventos_jogo` | ✅ Migrado | UUID, suporta `parent_feedback` |
| `relatorios_desenvolvimento` | ✅ Migrado | Nova estrutura |
| `observacoes_atividades` | ✅ Migrado | Nova estrutura |
| `marcos_desenvolvimento` | ✅ Migrado | 45 marcos (seed) |
| `marcos_crianca` | ✅ Migrado | Tracking individual |
| `sessoes_profissionais` | ✅ Migrado | Terapias |

### 🎨 Assets & Storage
| Tipo | Status |
|------|---------|
| Imagens (Don, Logo, Brinquedos) | ✅ Centralizado em `lib/storage.ts` |
| Áudio (BGM) | ⚠️ Helper criado, não integrado |
| Animações (Confetti) | ✅ URL configurada |

---

## ❌ PENDENTE (Funcionalidades críticas não migradas)

### 🎵 1. Background Music (BGM)
**Arquivo:** `legacy/public/app.js` (linhas 5-148)

**Funcionalidades:**
- ✅ Autoplay com unlock por interação do usuário
- ✅ Toggle global (botão flutuante)
- ✅ Persistência de preferência (localStorage)
- ✅ Volume 50% default
- ✅ Emissão de eventos customizados (`bgm:change`)
- ✅ Sincronização entre páginas

**Implementação legado:**
```javascript
const BGM_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/audios/sound_trakcs/difacil_audio_track_voiceless.mp3';
window.bgmController = {
  setEnabled: setBgmEnabled,
  toggle: toggleBgm,
  isEnabled: () => bgmDesired,
  isPlaying: () => !!(bgmEl && !bgmEl.paused)
};
```

**Ação:** Criar `lib/bgm.ts` + componente `<BGMProvider>` global

---

### 🧭 2. Bottom Navbar (Navegação Inferior)
**Arquivo:** `legacy/public/app.js` (linhas 150-208)

**Funcionalidades:**
- ✅ Navbar fixo inferior com 3 tabs: Jogos | Crianças | Config
- ✅ Ícones SVG customizados
- ✅ Highlight da rota ativa
- ✅ Auto-hide em rotas específicas (welcome, login, register)
- ✅ Acessibilidade (aria-label)

**Implementação legado:**
```javascript
const NAVBAR_ROUTES = ['#/games', '#/children', '#/settings'];
const NAVBAR_HIDDEN_ROUTES = ['#/', '#/welcome', '#/login', '#/register'];
```

**Ação:** Criar `components/bottom-nav.tsx` (já existe mas não é global/condicional)

---

### ♿ 3. Acessibilidade (A11y)
**Arquivo:** `legacy/public/utils/accessibility.js`

**Funcionalidades:**
- ✅ ARIA live region global (`a11yAnnounce`)
- ✅ Focus trap para modais (`trapFocus`)
- ✅ Screen reader announcements

**Implementação legado:**
```javascript
window.a11yAnnounce = (msg) => { 
  live.textContent = ''; 
  setTimeout(()=> live.textContent = msg, 10); 
};
```

**Ação:** Criar `lib/accessibility.ts` + hook `useA11yAnnounce`

---

### 📊 4. Parent Feedback Modal (Modal de Feedback dos Pais)
**Arquivo:** `legacy/public/games/onde-esta-o-brinquedo.js` (linhas 88-221)

**Funcionalidades:**
- ✅ Modal exibido AO FINAL do jogo (após completar todos os níveis)
- ✅ 3 perguntas obrigatórias:
  1. **Meu filho:** Achou sozinho | Precisou de ajuda | Não se interessou
  2. **Durante a atividade, ele:** Olhou para mim | Apontou | Vocalizou/fez som
  3. **Como foi pra mim:** Fácil | Difícil | Muito difícil
- ✅ Mensagem educativa: "O Raízes não substitui o adulto"
- ✅ Dados salvos em `eventos_jogo` com `tipo_evento: 'parent_feedback'`
- ✅ Inclui `completed_levels` e `correct_count` automaticamente

**Dados salvos:**
```javascript
{
  type: 'parent_feedback',
  child_behavior: 'found_alone' | 'needed_help' | 'not_interested',
  child_interaction: 'looked_at_me' | 'pointed' | 'vocalized',
  parent_difficulty: 'easy' | 'difficult' | 'very_difficult',
  completed_levels: number,
  correct_count: number
}
```

**Ação:** Adicionar `<ParentFeedbackModal>` no final do jogo

---

### 📋 5. Parent Report (Relatório dos Pais)
**Arquivo:** `legacy/public/pages/progress.js` (linhas 47-62, 284-532)

**Funcionalidades:**
- ✅ Botão "Relatório do Pai" na página Progress
- ✅ Modal fullscreen com:
  - Métricas gerais (sessões, acertos, erros, acurácia, tempo médio)
  - Lista de todos os feedbacks dos pais (ordenados por data)
  - Labels traduzidos (ex: `found_alone` → "Achou sozinho")
  - Data/hora de cada feedback
- ✅ Busca em `eventos_jogo` filtrando `tipo_evento = 'parent_feedback'`

**Implementação legado:**
```javascript
async getParentFeedback(childId) {
  const { data: feedbacks } = await client
    .from('eventos_jogo')
    .select('id_sessao, data_hora, dados_adicionais')
    .eq('tipo_evento', 'parent_feedback')
    .order('data_hora', { ascending: false });
  return feedbacks;
}
```

**Ação:** Adicionar botão e modal de relatório dos pais em `app/progress/page.tsx`

---

### 📈 6. Gráficos de Evolução (Canvas Charts)
**Arquivo:** `legacy/public/pages/progress.js` (linhas 110-280)

**Funcionalidades:**
- ✅ Canvas nativo (600x280px)
- ✅ 2 tipos de gráfico:
  1. **Sem dados por dia:** Barras verticais (Sessões, Acerto%, Reação, Nível)
  2. **Com dados por dia:** Linha de evolução da acurácia ao longo do tempo
- ✅ Eixos X/Y com labels
- ✅ Grid de fundo
- ✅ Gradientes de cor
- ✅ Formatação de datas (DD/MM)

**Ação:** Manter canvas nativo OU migrar para Chart.js/Recharts

---

### 📱 7. PWA (Progressive Web App)
**Arquivos:** 
- `legacy/public/sw.js` (Service Worker)
- `legacy/public/manifest.json`

**Funcionalidades:**
- ✅ Instalável no dispositivo
- ✅ Cache de assets offline
- ✅ Ícones e splash screens
- ✅ Nome do app, tema, descrição

**Ação:** Configurar Next.js PWA via `next-pwa`

---

### 🔊 8. Text-to-Speech (TTS)
**Arquivo:** `legacy/public/pages/welcome.js` (linhas 28-40)

**Funcionalidades:**
- ✅ Narração automática do Don ("Eu sou o Don!")
- ✅ Verifica preferência `tts_enabled` no localStorage
- ✅ Voz em pt-BR, rate 0.9, pitch 1.1

**Ação:** Criar hook `useTTS` + integração nas páginas

---

## 🔄 DIFERENÇAS ARQUITETURAIS

### Legado (SPA Vanilla)
- Router baseado em hash (`#/games`)
- Estado global em `localStorage` + `supabase.js`
- Modais via `display: none/block`
- Eventos customizados (`bgm:change`)

### Next.js 15 (Atual)
- App Router (`/games`)
- Estado em React hooks + Supabase client
- Modais via shadcn Dialog
- Context API / eventos React

---

## 📋 PLANO DE AÇÃO

### Prioridade Alta (Funcionalidades críticas)
1. ✅ **Parent Feedback Modal** - Ao final do jogo
2. ✅ **Parent Report** - Botão + modal na página Progress
3. ✅ **Bottom Navbar Global** - Condicional por rota
4. ⚠️ **Gráficos de Evolução** - Canvas ou lib de charts

### Prioridade Média (UX importante)
5. ⚠️ **Background Music (BGM)** - Controle global
6. ⚠️ **Acessibilidade (A11y)** - ARIA live + trapFocus

### Prioridade Baixa (Nice to have)
7. ⚠️ **PWA** - Instalação offline
8. ⚠️ **TTS** - Narração do Don

---

## 📊 MÉTRICAS DE MIGRAÇÃO

| Categoria | Total | Migrado | Pendente | % Completo |
|-----------|-------|---------|----------|------------|
| Páginas | 8 | 7 | 1 | 87% |
| Funcionalidades | 15 | 7 | 8 | 47% |
| Banco de Dados | 10 | 10 | 0 | 100% |
| Assets | 3 | 3 | 0 | 100% |
| **TOTAL** | **36** | **27** | **9** | **75%** |

---

## 🎯 PRÓXIMOS PASSOS

1. Implementar Parent Feedback Modal no jogo
2. Adicionar Parent Report na página Progress
3. Tornar Bottom Navbar global e condicional
4. Migrar gráficos de evolução
5. Implementar BGM Provider
6. Adicionar helpers de acessibilidade
7. Configurar PWA
8. Integrar TTS

---

**Última atualização:** 30/03/2026 22:41
