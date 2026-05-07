# TODO — Backlog Totum-Suite

## P0 — Crítico (bloqueia uso)

- [ ] Deployar backend no Render (configurar MONGO_URL e JWT_SECRET)
- [ ] Reverter modo demo no AuthContext (restaurar auth real)
- [ ] Verificar CORS no backend para suite.grupototum.com
- [ ] Testar login completo (email/senha + Google OAuth)

## P1 — Produto (melhoria funcional)

- [ ] Worker de scheduling: publicar posts agendados automaticamente na hora marcada
- [ ] "Modo Marca" no workspace: tom de voz, paleta, hashtags pilares para IA
- [ ] Validar `status` no listing de posts com `Literal` no query param
- [ ] Split de `server.py` em routers (`/backend/routers/{auth,workspaces,posts,...}.py`)
- [ ] Criar testes no frontend (React Testing Library)
- [ ] Documentar schema MongoDB em docs/SCHEMA.md

## P2 — Futuro (escala e integrações)

- [ ] Integrações reais (X API, Meta Graph API, LinkedIn API) — substituir mock
- [ ] Convites de membros por workspace + RBAC
- [ ] Upload nativo de mídia (S3 / Supabase Storage / Cloudinary)
- [ ] Inbox unificado (DMs e comentários)
- [ ] Aprovação multi-etapa (cliente → manager → publicação)
- [ ] Worker de analytics: coletar métricas reais das redes
- [ ] Notificações (email/push) para posts agendados e falhas
- [ ] API pública / webhooks para integrações externas
- [ ] Painel administrativo (usuários, workspaces, billing)

## P3 — Polimento

- [ ] Consolidar design system (remover inconsistências entre Swiss/azul e Totum/vermelho)
- [ ] Melhorar responsividade mobile
- [ ] Adicionar dark/light mode toggle
- [ ] Otimizar bundle (lazy load de páginas)
- [ ] Adicionar PWA (service worker, manifest)
