# Mixpost Clone — PRD

## Original Problem Statement
> https://github.com/inovector/mixpost — refaça o seguinte repositório do github (interface em PT-BR)

User choices:
- Escopo MVP completo (Workspaces, Contas mock, Composer, Calendário, Agendamento, Analytics)
- Integração com redes: **mock** (estrutura pronta para integração futura)
- Geração de conteúdo com IA: **sim** (Emergent LLM Key, modelo padrão `gpt-4o-mini`)
- Autenticação: **email/senha (JWT) + Google (Emergent Auth)** — ambos
- Idioma: Português (Brasil)

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) + MongoDB (motor async). Pydantic models, UUIDs, ISO datetimes, indexes criados no startup.
- **Frontend**: React + React Router + Tailwind + Recharts + lucide-react. Estilo Swiss/Brutalist (1px black borders, sharp corners, IKB blue + amarelo).
- **LLM**: `emergentintegrations.LlmChat` (OpenAI/Anthropic/Gemini selecionáveis no Composer).
- **Auth dupla**: `get_current_user` aceita cookie `access_token` (JWT) **ou** cookie `session_token` (Emergent Google) **ou** `Authorization: Bearer …`.

## User Personas
- Social Media Manager solo / pequena agência
- Time interno de marketing precisando agendar em múltiplos canais

## Core Requirements (static)
1. Cadastro/login email-senha + Google
2. Múltiplos workspaces por usuário (com troca rápida)
3. Conexão de contas sociais (Twitter/X, Facebook, Instagram, LinkedIn) — atualmente mock
4. Composer com preview por rede, contagem de caracteres, mídia (URL), agendamento
5. Sugestões de IA (3 variações de legenda + hashtags) — modelo escolhível
6. Calendário mensal com posts agendados/publicados
7. Listagem de posts com filtros por status (rascunho/agendado/publicado/falho)
8. Analytics agregados (impressões, engajamento, cliques, top posts, evolução diária, por rede)
9. Configurações de workspace (criar/editar/excluir)
10. Logout + sessão httpOnly cross-site

## Implemented (2026-05-07)
- ✅ Backend completo (auth dupla, workspaces, social accounts, posts, calendar, analytics, AI suggest) — **17/17 pytest pass**
- ✅ Seeding idempotente: `admin@mixpost.app/admin123` e `user@mixpost.app/user123`
- ✅ Frontend completo: Login/Register, Dashboard, Composer (com IA), Calendar, Posts, Accounts, Analytics, Settings
- ✅ Proteção de rotas, AuthCallback do Google, brute-force protection
- ✅ data-testid em todos os elementos interativos
- ✅ Design Swiss/Brutalist (Cabinet Grotesk + IBM Plex Sans)

## Backlog (P0/P1/P2)
**P1 — UX polish:**
- Substituir `<input type=datetime-local>` por shadcn Calendar+Popover no Composer (mantém consistência visual).

**P1 — robustez:**
- Brute-force: usar `X-Forwarded-For` em vez de `request.client.host` (mais preciso atrás de ingress).
- Validar `status` no listing com `Literal` no query param.

**P2 — produto:**
- Integrações reais (X, Meta, LinkedIn) substituindo as mock (estrutura pronta).
- Workers de scheduling (Celery/APS) que efetivamente publicam posts agendados.
- Convites de membros por workspace + RBAC.
- Upload nativo de mídia (S3/Cloudinary) em vez de URL.
- Splitting de `server.py` em routers (`/app/backend/routers/{auth,workspaces,posts,...}.py`).

## Test Credentials
Veja `/app/memory/test_credentials.md`.
