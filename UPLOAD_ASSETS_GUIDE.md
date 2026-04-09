# 📤 Guia de Upload de Assets - Supabase Storage

## ✅ Bucket Criado com Sucesso!

**Nome:** `game-assets`  
**Tipo:** Público  
**Limite:** 5MB por arquivo  
**Formatos:** PNG, JPG, WebP, SVG, JSON

---

## 🔐 Acesso ao Dashboard

1. Acesse: https://supabase.com/dashboard/project/vjeizqpzzfgdxbhetfdc/storage/buckets
2. Faça login com sua conta Supabase
3. Você verá o bucket **`game-assets`**

---

## 📁 Estrutura de Pastas para Upload

### **Jogo: Onde Estão os Animais**

Crie as seguintes pastas no bucket:

```
game-assets/
└── onde-estao-os-animais/
    ├── scenery/
    │   ├── background.png
    │   ├── trees/
    │   │   ├── tree-01.png
    │   │   ├── tree-02.png
    │   │   └── tree-03.png
    │   ├── rocks/
    │   │   ├── rock-01.png
    │   │   └── rock-02.png
    │   └── bushes/
    │       ├── bush-01.png
    │       └── bush-02.png
    └── animals/
        ├── lion.png
        ├── monkey.png
        ├── parrot.png
        ├── elephant.png
        ├── tiger.png
        └── zebra.png
```

---

## 🎯 Como Fazer Upload

### **Via Dashboard (Recomendado)**

1. Entre no bucket `game-assets`
2. Clique em **"Upload file"** ou **"New folder"**
3. Para criar pasta: Digite o caminho completo, ex: `onde-estao-os-animais/scenery/trees/`
4. Faça upload do arquivo
5. Repita para cada asset

### **Via Drag & Drop**

1. No dashboard, arraste os arquivos direto para a interface
2. Organize nas pastas criadas

---

## 🌐 URLs dos Assets

### **Formato Base:**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/<caminho>
```

### **Exemplos Específicos:**

#### **Cenário - Background**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/background.png
```

#### **Árvores**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/trees/tree-01.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/trees/tree-02.png
```

#### **Pedras**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/rocks/rock-01.png
```

#### **Arbustos**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/scenery/bushes/bush-01.png
```

#### **Animais**
```
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/lion.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/monkey.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/parrot.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/elephant.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/tiger.png
https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets/onde-estao-os-animais/animals/zebra.png
```

---

## ✅ Checklist de Upload

- [ ] **Cenário**
  - [ ] background.png
  - [ ] tree-01.png, tree-02.png, tree-03.png
  - [ ] rock-01.png, rock-02.png
  - [ ] bush-01.png, bush-02.png

- [ ] **Animais**
  - [ ] lion.png
  - [ ] monkey.png
  - [ ] parrot.png
  - [ ] elephant.png
  - [ ] tiger.png
  - [ ] zebra.png

---

## 🔄 Após Upload

**Avise-me quando terminar o upload que eu:**

1. ✅ Atualizo o código do jogo para usar as URLs do Supabase
2. ✅ Testo se as imagens estão carregando corretamente
3. ✅ Faço deploy para produção

---

## 📋 Convenções de Nomenclatura

- **Formato:** kebab-case (letras minúsculas, hífen para separar)
- **Exemplos corretos:** `tree-01.png`, `bush-happy.png`, `background-forest.png`
- **Evite:** espaços, acentos, caracteres especiais
- **PNG:** Para imagens com transparência
- **JPG/WebP:** Para backgrounds sem transparência (menor tamanho)

---

## 🚀 Vantagens do Supabase Storage

1. ✅ **CDN Global** - Assets servidos rápido em qualquer lugar
2. ✅ **Cache automático** - Performance otimizada
3. ✅ **Versionamento** - Fácil atualizar assets
4. ✅ **Backup** - Supabase faz backup automático
5. ✅ **Escalável** - Sem limite de tráfego

---

**Pronto para começar o upload!** 🎨
