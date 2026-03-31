# 🔄 Comparação Frontend - Legado vs Next.js 15

**Executar ambos em paralelo:**
```bash
# Windows
dev-parallel.bat

# Manual
cd legacy && npm run dev  # http://localhost:8080
cd apps/web && npm run dev # http://localhost:3000
```

---

## 📊 Matriz de Comparação - Páginas e Rotas

| # | Página | Legado | Next.js 15 | Status Visual |
|---|--------|--------|------------|---------------|
| 1 | **Splash/Welcome** | `http://localhost:8080/#/` | `http://localhost:3000/` | ⚠️ Comparar |
| 2 | **Login** | `http://localhost:8080/#/login` | `http://localhost:3000/login` | ⚠️ Comparar |
| 3 | **Registro** | `http://localhost:8080/#/register` | `http://localhost:3000/register` | ⚠️ Comparar |
| 4 | **Jogos (Lista)** | `http://localhost:8080/#/games` | `http://localhost:3000/games` | ⚠️ Comparar |
| 5 | **Onde está o brinquedo** | `http://localhost:8080/#/games/onde-esta-o-brinquedo` | `http://localhost:3000/games/onde-esta-o-brinquedo` | ⚠️ Comparar |
| 6 | **Crianças** | `http://localhost:8080/#/children` | `http://localhost:3000/children` | ⚠️ Comparar |
| 7 | **Progresso** | `http://localhost:8080/#/progress` | `http://localhost:3000/progress` | ⚠️ Comparar |
| 8 | **Configurações** | `http://localhost:8080/#/settings` | `http://localhost:3000/settings` | ⚠️ Comparar |

---

## 🎨 Checklist de Componentes UI

### **Layout Global**
- [ ] Navbar inferior (3 tabs: Jogos, Crianças, Config)
- [ ] Botão BGM (toggle música)
- [ ] Espaçamento inferior (pb-16 para navbar)
- [ ] Gradiente de fundo (verde)

### **Welcome/Splash**
- [ ] Logo Raízes
- [ ] Mascote Don (animado?)
- [ ] Botão "Começar"
- [ ] Narração TTS (opcional)

### **Login**
- [ ] Mascote Don lateral
- [ ] Input email + senha
- [ ] Botão "Entrar"
- [ ] Link "Criar conta"
- [ ] Cores: verde #234c38

### **Registro**
- [ ] Multi-step form (5 etapas)
- [ ] Mascote Don com dicas
- [ ] Validação de campos
- [ ] Seletor de data de nascimento
- [ ] Termos e condições

### **Games (Lista)**
- [ ] Card "Onde está o brinquedo"
- [ ] Thumbnail do jogo
- [ ] Descrição
- [ ] Botão "Jogar"

### **Onde está o brinquedo (Jogo)**
- [ ] Balão de fala do Don (instruções)
- [ ] 3 níveis (1, 2, 3 caixas)
- [ ] Animações (shake, pop, wiggle)
- [ ] Pontuação (score/attempts)
- [ ] Modal de feedback dos pais (ao final)
- [ ] TTS narrando instruções

### **Crianças**
- [ ] Lista de crianças cadastradas
- [ ] Card por criança (foto, nome, idade)
- [ ] Botão "Adicionar criança"
- [ ] Criança ativa (highlight)

### **Progresso**
- [ ] Seletor de criança
- [ ] Métricas (sessões, acertos, erros, acurácia, reação)
- [ ] Gráfico de evolução (Canvas)
- [ ] Botão "Relatório do Responsável"

### **Configurações**
- [ ] Toggle BGM
- [ ] Toggle TTS
- [ ] Dados do responsável
- [ ] Logout

---

## 🎯 Elementos Críticos para Validar

### **1. Cores e Tema**
| Elemento | Cor Esperada | Legado | Next.js |
|----------|--------------|--------|---------|
| Primary | `#234c38` | ✅ | ⚠️ |
| Background | `#edf4f0` | ✅ | ⚠️ |
| Text Dark | `#1b2b21` | ✅ | ⚠️ |
| Text Medium | `#3a5144` | ✅ | ⚠️ |

### **2. Tipografia**
- Fonte principal: `Inter` ou `Montserrat`
- Títulos: Bold 700-800
- Corpo: Regular 400

### **3. Espaçamentos**
- Cards: `rounded-2xl` ou `rounded-3xl`
- Botões: `rounded-full`
- Padding interno: `p-4` a `p-6`
- Gap entre elementos: `gap-3` a `gap-4`

### **4. Interações**
- [ ] BGM liga/desliga corretamente
- [ ] TTS narra instruções do jogo
- [ ] Navbar muda rota ativa
- [ ] Modais abrem e fecham
- [ ] Formulários validam
- [ ] Jogos registram eventos no Supabase

### **5. Animações**
- [ ] Confetti ao acertar (Lottie ou CSS)
- [ ] Shake da caixa escondendo brinquedo
- [ ] Pop do brinquedo revelado
- [ ] Wiggle da caixa errada

---

## 📸 Screenshots para Comparação

**Como tirar:**
1. Abrir ambos apps lado a lado
2. Navegar para mesma rota em ambos
3. Tirar screenshot fullscreen
4. Marcar diferenças visuais

**Páginas prioritárias:**
- ✅ Welcome
- ✅ Login
- ✅ Games
- ✅ Onde está o brinquedo (gameplay)
- ✅ Progress (com gráfico)

---

## 🐛 Diferenças Conhecidas

### **Legado (Vanilla JS)**
- Router baseado em hash (`#/games`)
- Estado em `localStorage`
- Modais via `display: none/block`
- Eventos customizados (`bgm:change`)
- Service Worker PWA

### **Next.js 15**
- App Router (`/games`)
- Estado em React hooks
- Modais via shadcn Dialog
- Context API
- next-pwa (configurado)

---

## ✅ Checklist de Validação

### **Funcional**
- [ ] Login funciona (mesmas credenciais)
- [ ] Registro cria usuário no Supabase
- [ ] Jogo salva eventos no banco
- [ ] Feedback dos pais é registrado
- [ ] Relatório exibe feedbacks salvos
- [ ] BGM toca e pausa
- [ ] TTS narra corretamente

### **Visual**
- [ ] Cores idênticas
- [ ] Fontes e tamanhos similares
- [ ] Espaçamentos proporcionais
- [ ] Animações fluidas
- [ ] Responsivo mobile

### **Performance**
- [ ] Tempo de carregamento similar
- [ ] Animações sem lag
- [ ] Áudio sem atrasos

---

**Última atualização:** 31/03/2026 10:05
