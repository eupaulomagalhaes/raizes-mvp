# 📦 Estrutura Supabase Storage - Raízes

## 🎯 Organização Recomendada

### **Bucket: `game-assets`** (público)

```
game-assets/
├── onde-esta-o-brinquedo/
│   ├── mascot/
│   │   └── don-mascot.png
│   ├── toys/
│   │   ├── giraffe.png
│   │   ├── robot.png
│   │   └── dinosaur.png
│   └── animations/
│       ├── confetti.json
│       └── hand-click.json
│
├── onde-estao-os-animais/
│   ├── scenery/
│   │   ├── background.png
│   │   ├── trees/
│   │   │   ├── tree-01.png
│   │   │   ├── tree-02.png
│   │   │   └── tree-03.png
│   │   ├── rocks/
│   │   │   ├── rock-01.png
│   │   │   └── rock-02.png
│   │   └── bushes/
│   │       ├── bush-01.png
│   │       └── bush-02.png
│   └── animals/
│       ├── lion.png
│       ├── monkey.png
│       ├── parrot.png
│       ├── elephant.png
│       ├── tiger.png
│       └── zebra.png
│
├── explorando-padroes-e-mapas/
│   └── (assets futuros...)
│
└── shared/
    ├── mascot/
    │   ├── don-neutral.png
    │   ├── don-happy.png
    │   └── don-thinking.png
    └── ui/
        ├── icons/
        └── backgrounds/
```

---

## 🔐 Políticas RLS (Row Level Security)

### **Bucket `game-assets`**
- **Tipo:** Público
- **Acesso:** Leitura pública (sem autenticação necessária)
- **Upload:** Apenas authenticated users (admin)

```sql
-- Política de leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-assets');

-- Política de upload apenas para autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-assets' AND auth.role() = 'authenticated');
```

---

## 📝 URLs de Acesso

### **Formato:**
```
https://<PROJECT_ID>.supabase.co/storage/v1/object/public/game-assets/<path>
```

### **Exemplos:**
```typescript
// Don mascot compartilhado
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/shared/mascot/don-neutral.png

// Leão do jogo "Onde estão os animais"
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/lion.png

// Background da floresta
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/background.png
```

---

## 🚀 Implementação

### **1. Criar Bucket**
```sql
-- Via SQL ou Dashboard do Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-assets', 'game-assets', true);
```

### **2. Atualizar Código**
```typescript
// apps/web/src/config/assets.ts
const SUPABASE_STORAGE_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets'

export const ASSETS = {
  ondeEstaoOsAnimais: {
    scenery: {
      background: `${SUPABASE_STORAGE_URL}/onde-estao-os-animais/scenery/background.png`,
      trees: [
        `${SUPABASE_STORAGE_URL}/onde-estao-os-animais/scenery/trees/tree-01.png`,
        `${SUPABASE_STORAGE_URL}/onde-estao-os-animais/scenery/trees/tree-02.png`,
      ],
      // ...
    },
    animals: {
      lion: `${SUPABASE_STORAGE_URL}/onde-estao-os-animais/animals/lion.png`,
      // ...
    }
  }
}
```

---

## 📏 Especificações Técnicas

### **Imagens**
- Formato: PNG com transparência
- Compressão: Otimizada para web
- Tamanho máximo: 5MB por arquivo
- Nome: kebab-case (ex: `lion-happy.png`)

### **Animações Lottie**
- Formato: JSON
- Tamanho máximo: 1MB
- Otimizado e minificado

---

## ✅ Vantagens desta Estrutura

1. **Organização por jogo** - Fácil de gerenciar
2. **Assets compartilhados** - Evita duplicação (Don mascot, etc)
3. **Escalável** - Novos jogos = nova pasta
4. **CDN automático** - Supabase Storage tem CDN integrado
5. **Versionamento** - Fácil substituir assets mantendo estrutura

---

## 🔄 Migração Gradual

Você pode:
1. **Começar local** (`public/assets`) - desenvolvimento
2. **Upload gradual** - jogo por jogo
3. **Trocar URLs** - quando assets estiverem no Supabase
4. **Manter híbrido** - Local para dev, Supabase para prod

---

**Quer que eu crie o bucket e configure as políticas agora via MCP?** 🚀
