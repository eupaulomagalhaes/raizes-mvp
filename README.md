# Raízes – Jogos Cognitivos Kids (MVP)

Monorepo Vanilla (HTML/CSS/JS) com roteador por hash, PWA, acessibilidade e Supabase Auth.

## Rodar localmente

- Node: `npx http-server ./public -p 5173`
- Acesse: http://localhost:5173/#/

## Estrutura

- public/
  - index.html, styles.css, app.js, router.js, manifest.json, sw.js
  - components/, utils/, pages/, games/, img/

## Supabase

- Auth real via `@supabase/supabase-js` (CDN ESM).
- Tabelas reais no onboarding: `public.usuarios`, `public.criancas`.
- Jogo e progresso usam stubs locais para sessões/eventos (pode migrar depois).

## Deploy (Vercel)

- `vercel.json` incluído. Configure projeto apontando `Output Directory = public` e sem build.

## Licença

MVP para testes internos.
