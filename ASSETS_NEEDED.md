# 🎨 Assets Necessários - Onde Estão os Animais

## 📁 Estrutura de Pastas

```
apps/web/public/assets/
├── forest/              # Cenário da floresta (layers para profundidade)
│   ├── background.png   # Fundo base da floresta
│   ├── trees.png        # Camada de árvores
│   ├── rocks.png        # Camada de pedras
│   └── bushes.png       # Camada de arbustos
│
└── animals/             # Animais do jogo
    ├── lion.png         # Leão
    ├── monkey.png       # Macaco
    ├── parrot.png       # Papagaio
    ├── elephant.png     # Elefante
    ├── tiger.png        # Tigre
    └── zebra.png        # Zebra
```

## 🎯 Especificações Técnicas

### Cenário (Floresta)
- **Formato:** PNG com transparência
- **Resolução:** 1920x1080px (landscape)
- **Layers separados** para criar profundidade visual
- Elementos interativos devem ser destacados visualmente

### Animais
- **Formato:** PNG com transparência
- **Tamanho:** ~200x200px (podem variar ligeiramente)
- **Estilo:** Amigável e cartoon, consistente com Don mascot
- **Background:** Transparente para sobrepor no cenário

## 🎨 Diretrizes de Design

1. **Cores vibrantes** mas não saturadas demais
2. **Alto contraste** para facilitar visualização infantil
3. **Elementos bem definidos** para fácil identificação
4. **Estilo consistente** entre todos os assets

## ✅ Status de Implementação

- [x] Estrutura de código criada
- [x] Lógica do jogo implementada
- [x] Migrations Supabase prontas
- [x] Placeholders criados
- [ ] **Assets reais pendentes** ⬅️ VOCÊ ESTÁ AQUI

## 🚀 Próximos Passos

1. Criar os assets conforme especificações acima
2. Substituir placeholders nos caminhos:
   - `apps/web/public/assets/forest/`
   - `apps/web/public/assets/animals/`
3. Testar no ambiente local
4. Deploy para produção

---

**Nota:** O jogo está funcionando com emojis como placeholder. Quando os assets estiverem prontos, basta substituir os arquivos nas pastas indicadas e atualizar os caminhos no código (já está preparado).
