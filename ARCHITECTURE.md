# Arquitetura do Totum-Suite

## Visão geral

Totum-Suite é um MicroSaaS de gestão de mídias sociais. Arquitetura **full-stack separada**: frontend SPA no Vercel comunica-se com backend FastAPI no Render via REST + cookies httpOnly.

```
┌─────────────┐      HTTPS + cookies      ┌─────────────┐      TCP      ┌─────────────┐
│   Vercel    │  ───────────────────────► │   Render    │ ────────────► │MongoDB Atlas│
│  (React)    │                           │  (FastAPI)  │               │   (Motor)   │
└─────────────┘                           └─────────────┘               └─────────────┘
```

## Stack detalhada

### Frontend
- **Framework:** React 19 (Create React App + Craco)
- **Estilo:** Tailwind CSS 3.4 + shadcn/ui (radix-based)
- **Gráficos:** Recharts
- **Ícones:** lucide-react
- **Fontes:** Cabinet Grotesk (heading) + IBM Plex Sans (body) — definido em design_guidelines.json
- **Roteamento:** React Router v6
- **Build:** Craco (custom webpack sem eject)
- **Deploy:** Vercel, domínio `suite.grupototum.com`

### Backend
- **Framework:** FastAPI 0.110
- **Servidor:** Uvicorn 0.25
- **Banco:** MongoDB 6.x via Motor 3.3 (async)
- **Auth:** PyJWT + bcrypt + cookies httpOnly
- **Validação:** Pydantic v2
- **Deploy:** Docker no Render

### Banco de dados (MongoDB)

7 collections principais:

| Collection | Propósito | Índices criados no startup |
|------------|-----------|---------------------------|
| `users` | Usuários (email/senha e Google) | `email` (unique), `user_id` |
| `workspaces` | Workspaces por usuário | `workspace_id`, `owner_id` |
| `social_accounts` | Contas sociais conectadas (mock) | `workspace_id`, `account_id` |
| `posts` | Posts (draft/scheduled/published) | `workspace_id`, `status`, `scheduled_at` |
| `user_sessions` | Sessões JWT + Emergent Google | `session_token` (TTL 7 dias) |
| `login_attempts` | Brute-force protection | `identifier` (TTL 15 min) |
| `password_reset_tokens` | Tokens de reset de senha | `token` (TTL 1 hora) |

## Endpoints da API

Prefixo: `/api`

### Auth (`/api/auth`)
- `POST /register` — Email/senha
- `POST /login` — Email/senha + cookies
- `POST /logout` — Limpa cookies
- `POST /refresh` — Refresh token
- `GET /me` — Usuário atual
- `POST /session` — Troca session_id (Emergent Google) por session_token
- `POST /forgot-password`
- `POST /reset-password`

### Workspaces (`/api/workspaces`)
- `GET /` — Listar
- `POST /` — Criar
- `DELETE /{id}` — Excluir (cascade em posts e contas)
- `POST /{id}/activate` — Trocar workspace ativo

### Social Accounts (`/api/social-accounts`)
- `GET /` — Listar por workspace
- `POST /` — Conectar (mock)
- `DELETE /{id}` — Desconectar

### Posts (`/api/posts`)
- `GET /` — Listar com filtros (status, data)
- `POST /` — Criar draft
- `PATCH /{id}` — Atualizar
- `DELETE /{id}` — Excluir
- `POST /{id}/publish` — Publicar mock (gera métricas fake)

### Calendar (`/api/calendar`)
- `GET /` — Posts em janela de datas

### Analytics (`/api/analytics/summary`)
- `GET /` — Totais, por rede, evolução diária, top posts

### AI (`/api/ai/suggest`)
- `POST /` — Gera 3 variações de legenda + hashtags (requer `EMERGENT_LLM_KEY`)

### Health
- `GET /api/health` — `{ "status": "ok" }`

## Auth e segurança

`get_current_user` resolve em ordem:
1. Cookie `access_token` (JWT próprio)
2. Cookie `session_token` (Emergent Google)
3. Header `Authorization: Bearer <token>`

Proteções:
- Brute-force: 5 tentativas em 15 min → 429
- Passwords hasheados com bcrypt
- Tokens JWT com expiração curta (15 min access, 7 dias refresh)
- Cookies `httpOnly`, `secure`, `SameSite=lax`

## Decisões técnicas

1. **MongoDB em vez de SQL** — Escolhido pelo agente original para flexibilidade de schema em MVP. Collections são pequenas; não há joins complexos.
2. **server.py monolito** — MVP rápido. Backlog P2 inclui split em routers.
3. **CRA em vez de Next.js** — SPA simples sem necessidade de SSR. Craco permite customização sem eject.
4. **Modo demo no frontend** — AuthContext bypassa login quando backend não está disponível. **Deve ser revertido antes de produção.**
5. **Render para backend** — Docker simples, tier gratuito. Alternativa: Railway, Fly.io.

## Variáveis de ambiente

### Frontend (Vercel)
- `REACT_APP_BACKEND_URL` — URL do backend (ex: `https://totum-suite-api.onrender.com`)

### Backend (Render)
- `MONGO_URL` — URL de conexão MongoDB Atlas
- `DB_NAME` — Nome do database (padrão: `totum_suite`)
- `JWT_SECRET` — Chave secreta para JWT (mín. 32 chars)
- `CORS_ORIGINS` — Origens permitidas (ex: `*` ou URL do Vercel)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Seed de admin
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — Seed de usuário teste
- `EMERGENT_LLM_KEY` — Opcional, para AI suggest

## Pontos de atenção

- **server.py monolito (828 linhas)** — Qualquer mudança afeta múltiplos domínios. Split em routers é prioridade P2.
- **Modo demo ativo** — Inseguro. Reverter assim que backend estiver deployado.
- **Funcionalidade de IA inoperante** — Pacote `emergentintegrations` era privado; removido do requirements.txt. AI suggest retorna 503 quando não instalado.
- **Sem testes no frontend** — Apenas backend tem cobertura.
