# 🚀 Guia de Desenvolvimento - Raízes Educacional

## 🔄 Rodar Ambos Apps em Paralelo (Comparação Frontend)

### **Modo Rápido (Windows)**
```bash
dev-parallel.bat
```

Este script abrirá **2 janelas do terminal**:
- **Legado:** `http://localhost:8080` (Vanilla JS)
- **Next.js:** `http://localhost:3000` (React + Next.js 15)

---

### **Modo Manual**

**Terminal 1 - Legado:**
```bash
cd legacy
npm run dev
```

**Terminal 2 - Next.js:**
```bash
cd apps/web
npm run dev
```

---

## 📊 Comparação de Páginas

Consulte `FRONTEND_COMPARISON.md` para matriz completa de rotas e componentes.

### **Rotas Principais:**

| Página | Legado (Hash Router) | Next.js (App Router) |
|--------|---------------------|---------------------|
| Welcome | `http://localhost:8081/#/` | `http://localhost:3000/` |
| Login | `http://localhost:8081/#/login` | `http://localhost:3000/login` |
| Jogos | `http://localhost:8081/#/games` | `http://localhost:3000/games` |
| Jogo | `http://localhost:8081/#/games/onde-esta-o-brinquedo` | `http://localhost:3000/games/onde-esta-o-brinquedo` |
| Crianças | `http://localhost:8081/#/children` | `http://localhost:3000/children` |
| Progresso | `http://localhost:8081/#/progress` | `http://localhost:3000/progress` |
| Config | `http://localhost:8081/#/settings` | `http://localhost:3000/settings` |

---

## 🎨 Checklist de Validação Visual

### **1. Cores do Tema**
- ✅ Primary: `#234c38` (verde escuro)
- ✅ Background: `#edf4f0` (verde claro)
- ✅ Text: `#1b2b21` (escuro), `#3a5144` (médio)

### **2. Componentes Globais**
- [ ] Bottom Navbar (3 tabs fixos)
- [ ] BGM Toggle (botão flutuante superior direito)
- [ ] Gradiente de fundo verde
- [ ] Padding inferior (pb-16) para navbar

### **3. Páginas Específicas**

#### **Welcome/Splash**
- [ ] Logo Raízes centralizado
- [ ] Mascote Don (imagem ou animação)
- [ ] Botão "Começar" grande e verde
- [ ] Narração TTS opcional

#### **Login**
- [ ] Mascote Don lateral esquerdo
- [ ] Inputs email/senha com bordas arredondadas
- [ ] Botão "Entrar" verde
- [ ] Link "Criar conta" abaixo

#### **Registro**
- [ ] Formulário multi-step (5 etapas)
- [ ] Mascote Don com balão de dicas
- [ ] Progress indicator (dots ou steps)
- [ ] Validação de campos

#### **Games (Lista)**
- [ ] Card "Onde está o brinquedo"
- [ ] Thumbnail 300x200px aprox
- [ ] Título + descrição
- [ ] Botão "Jogar" destacado

#### **Onde está o brinquedo (Gameplay)**
- [ ] Balão de fala do Don (instruções)
- [ ] 3 níveis progressivos (1, 2, 3 caixas)
- [ ] Placar score/attempts (top direito)
- [ ] Animações: shake, pop, wiggle
- [ ] Modal feedback pais (ao completar 3 níveis)
- [ ] TTS narrando cada fase

#### **Progresso**
- [ ] Selector de criança (dropdown)
- [ ] Cards de métricas (2x2 grid)
- [ ] Gráfico de evolução (Canvas 600x280)
- [ ] Botão "Relatório do Responsável"
- [ ] Modal de relatório (lista feedbacks)

#### **Crianças**
- [ ] Lista de crianças em cards
- [ ] Foto circular + nome + idade
- [ ] Criança ativa destacada
- [ ] Botão "Adicionar criança"

#### **Configurações**
- [ ] Toggle BGM on/off
- [ ] Toggle TTS on/off
- [ ] Dados do responsável
- [ ] Botão logout

---

## 🐛 Diferenças Arquiteturais

### **Legado (Vanilla JS)**
- Router: Hash-based (`#/games`)
- Estado: `localStorage` + variáveis globais
- Modais: `display: none/block` + CSS classes
- Eventos: Custom events (`bgm:change`)
- PWA: Service Worker manual (`sw.js`)
- Build: Nenhum (serve estático)

### **Next.js 15**
- Router: App Router (`/games`)
- Estado: React hooks (`useState`, `useEffect`)
- Modais: shadcn Dialog components
- Eventos: React Context API
- PWA: next-pwa (configurado via `manifest.json`)
- Build: `npm run build` (otimizado)

---

## 🎯 Fluxo de Teste Recomendado

1. **Abrir ambos apps lado a lado** (2 janelas de navegador)
2. **Navegar simultaneamente** na mesma rota
3. **Comparar visualmente:**
   - Layout e espaçamentos
   - Cores e tipografia
   - Animações e transições
   - Interações (cliques, hover)
4. **Testar funcionalidades:**
   - Login/registro (mesmas credenciais)
   - Jogo completo (3 níveis)
   - Feedback dos pais
   - Relatório de progresso
   - BGM on/off
   - TTS narração
5. **Verificar Supabase:**
   - Eventos registrados corretamente
   - Parent feedback salvo
   - Sessões finalizadas

---

## 📸 Como Documentar Diferenças

**Quando encontrar discrepâncias:**

1. Tirar screenshot de ambos apps
2. Anotar em `FRONTEND_COMPARISON.md`
3. Criar issue no GitHub (se necessário)
4. Marcar como ⚠️ ou ❌ na matriz

**Exemplo:**
```markdown
### Diferença encontrada: Botão Login
- **Legado:** `bg-[#234c38] rounded-full px-8 py-3`
- **Next.js:** `bg-primary-600 rounded-xl px-6 py-2`
- **Ação:** Ajustar Next.js para usar `rounded-full` e padding maior
```

---

## 🛠️ Ferramentas de Desenvolvimento

### **Legado**
- Browser DevTools (Console, Network)
- Lighthouse (PWA check)
- Application > Service Workers

### **Next.js**
- React DevTools
- Next.js DevTools (built-in)
- Vercel Speed Insights (opcional)

---

## 🔥 Comandos Úteis

```bash
# Limpar cache do legado
rm -rf legacy/.git

# Rebuild Next.js
cd apps/web && npm run build

# Rodar apenas legado
cd legacy && npx http-server public -p 8081

# Rodar apenas Next.js
cd apps/web && npm run dev

# Instalar dependências
npm install # (root - se houver)
cd apps/web && npm install
```

---

**Última atualização:** 31/03/2026 10:10
