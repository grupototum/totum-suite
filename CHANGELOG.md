# Changelog

## [0.1.0] — 2026-05-07 — MVP Inicial

### Adicionado
- Frontend completo: Login, Register, Dashboard, Composer, Calendar, Posts, Accounts, Analytics, Settings
- Backend completo: Auth dupla (JWT + Google), Workspaces CRUD, Social Accounts (mock), Posts lifecycle, Calendar, Analytics, AI Suggest
- Design system Swiss/Brutalist com shadcn/ui
- Seed automático de usuários (admin@mixpost.app / user@mixpost.app)
- Proteção de rotas + AuthCallback para Google OAuth
- Brute-force protection (5 tentativas → 429)
- Testes de regressão backend (17/17 pytest passando)
- Dockerfile e render.yaml para deploy no Render

### Corrigido
- Build no Vercel: corrigido framework de `vitepress` para `create-react-app`
- Dependências do useEffect: adicionado `useCallback` em `load` (AccountsPage, PostsPage)
- Warnings como erros no CI: adicionado `CI=false` ao buildCommand
- Badge "Made with Emergent": removido do index.html
- Loading infinito: adicionado `.catch()` em chamadas API (Analytics, Accounts, Calendar, Dashboard, Posts)

### Alterado
- Marca aplicada: logo Totum, paleta vermelho cereja `#E63946`, favicon, título
- Modo demo ativado no AuthContext para contornar backend não deployado
- Dependência `emergentintegrations` removida do requirements.txt (pacote privado)

### Notas
- Backend não deployado no Render (aguardando MONGO_URL)
- Domínio suite.grupototum.com configurado no Vercel
- Branch de segurança: `backup/main-2026-05-07`
- Tag: `v0.1.0-mvp`
