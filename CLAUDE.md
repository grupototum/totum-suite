# CLAUDE.md — Totum-Suite

**Versão:** 2.0
**Atualizado:** 2026-05-10
**Nível:** [ ] LP/Site  [ ] MVP  [x] Teste  [ ] Produção
**Sistema:** Vibe Coding Totum v3.0

---

## PERGUNTA-GATILHO

> **Nível atual: TESTE** — backend não deployado, AuthContext em modo demo.  
> Toda mudança passa por: Revisão Pré-Produção → Raio-X → Teste → Deploy  
> **P0 BLOQUEADORES:** deployar backend Render + reverter modo demo AuthContext

---

## O que é este projeto

Totum-Suite é um SaaS de gestão de mídias sociais (clone do Mixpost). Stack: React 19 (CRA) no frontend, FastAPI + MongoDB no backend. Idioma: Português (Brasil).

## Arquitetura resumida

- **Frontend:** SPA React no Vercel. Comunica com backend via REST + cookies httpOnly.
- **Backend:** FastAPI monolito (server.py, 828 linhas) no Render (Docker).
- **Banco:** MongoDB Atlas, 7 collections (users, workspaces, social_accounts, posts, user_sessions, login_attempts, password_reset_tokens).
- **Auth:** JWT próprio + Google OAuth via Emergent Auth. `get_current_user` aceita cookie `access_token`, cookie `session_token` ou header Bearer.

## Convenções de código

### Frontend
- Imports absolutos via `@/` (configurado no jsconfig.json + craco.config.js)
- Componentes UI em `src/components/ui/` (shadcn/ui)
- Componentes próprios em `src/components/`
- Páginas em `src/pages/`
- Contextos em `src/contexts/`
- Hooks em `src/hooks/`
- API centralizada em `src/lib/api.js`
- **data-testid obrigatório** em todos os elementos interativos (regra do design_guidelines.json)
- Estilo: Tailwind + variáveis CSS customizadas (definidas em index.css)

### Backend
- Pydantic v2 para validação
- UUIDs para IDs de entidades
- Datetimes em ISO 8601 UTC
- Motor async para MongoDB
- Logs com `logging.getLogger("mixpost")`

### Design
- **Archetype:** Swiss & High-Contrast (Brutalist técnico)
- **Cores primárias:** Preto `#0A0A0A`, Vermelho cereja `#E63946` (marca Totum)
- **Cores secundárias:** Branco `#FAFAFA`, Cinza `#525252`
- **Tipografia:** Cabinet Grotesk (headings) + IBM Plex Sans (body)
- **Bordas:** 1px sólido, cantos quadrados ou arredondamento mínimo
- **Sombras:** Sólidas offset (ex: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)

## Regras ao alterar código

1. **Nunca quebre o build do frontend.** `yarn build` deve passar sempre.
2. **Nunca quebre os testes do backend.** `pytest tests/test_mixpost_api.py -v` deve passar 17/17.
3. **One Change per Prompt.** Não altere múltiplas áreas simultaneamente.
4. **Auth:** O AuthContext está em modo demo (usuário mock fixo). Isso foi feito para contornar backend não deployado. **Reverter quando backend estiver ativo.**
5. **API calls no frontend:** Sempre adicione `.catch()` em chamadas `api.get()`/`api.post()` dentro de `useEffect` para evitar loading infinito.
6. **Não use gradients, purple, violet ou teal.** (regra do design system)
7. **Preserve data-testid** em elementos interativos.
8. **Commits pequenos e descritivos.** Evite "auto-commit" ou mensagens genéricas.

## Estrutura de pastas importante

```
frontend/src/pages/         # 8 páginas: Dashboard, Composer, Calendar, Posts, Accounts, Analytics, Settings, Login
frontend/src/components/ui/ # ~50 componentes shadcn/ui
frontend/src/lib/api.js     # Axios instance com interceptors
backend/server.py           # Monolito FastAPI (828 linhas, 25 endpoints)
backend/tests/              # 17 testes de regressão
```

## Variáveis de ambiente críticas

- `REACT_APP_BACKEND_URL` (Vercel) — aponta para backend Render
- `MONGO_URL` (Render) — conexão MongoDB Atlas
- `JWT_SECRET` (Render) — chave de assinatura JWT

## Backlog prioritário

1. **P0:** Deployar backend no Render (falta MONGO_URL)
2. **P0:** Reverter modo demo no AuthContext
3. **P1:** Split de server.py em routers
4. **P1:** Testes no frontend
5. **P2:** Integrações reais com redes sociais
6. **P2:** Worker de agendamento de posts
7. **P2:** Upload de mídia (S3/Supabase Storage)

## NO-FLY ZONES — NÃO ALTERAR SEM APROVAÇÃO HUMANA

```
[x] Auth: AuthContext, JWT, Google OAuth, get_current_user
[x] Schema MongoDB: alterações em collections existentes
[x] Variáveis de ambiente: JWT_SECRET, MONGO_URL, REACT_APP_BACKEND_URL
[x] CORS: configuração no backend
[x] Deploy: Vercel (frontend) ou Render (backend)
[x] Reverter modo demo: só quando backend estiver confirmado no ar
```

---

## SAÚDE TÉCNICA (Fase 0 — 2026-05-10)

| Verificação | Status | Detalhe |
|---|---|---|
| Build frontend | ⚠️ verificar | `yarn build` deve passar |
| Testes backend | ⚠️ verificar | `pytest tests/test_mixpost_api.py` — 17/17 |
| AuthContext | 🔴 DEMO | Segurança zero — reverter com urgência após backend |
| Backend deploy | 🔴 P0 | Falta MONGO_URL no Render |
| .env protegido | ✅ OK | variáveis de ambiente não expostas no repo |

---

## SKILLS E FERRAMENTAS

| Situação | Usar |
|---|---|
| Revisão antes de deploy | `skill-revisao-pre-producao.md` |
| Auditoria de limpeza | `skill-raio-x.md` |
| Debug de bug difícil | `skill-debug-profundo.md` |
| Antes de commitar | `skill-revisor-commit.md` |
| Criar componente React | `skill-criador-componente.md` |
| Eliminar duplicações | `skill-refatorador-dry.md` |

> Skills em: `VIBE CODING TOTUM SYSTEM/Skills para IAs/`

---

## REGRAS QUE NUNCA MUDAM (Totum Torah)

1. Sempre perguntar: **LP/Site | MVP | Teste | Produção?**
2. **Uma mudança por prompt**
3. **Testar antes de commitar**
4. **Documentar antes de mexer**
5. **IA sugere. Humano aprova** (em No-Fly Zones)
6. **Preservar o que funciona**
7. Prioridade: **Confiabilidade → Velocidade → Performance**

---

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Diagramas e decisões técnicas
- [KIMI.md](./KIMI.md) — Contexto específico para frontend/componentes
- [TODO.md](./TODO.md) — Backlog detalhado
- [BUGS.md](./BUGS.md) — Issues conhecidas

---

*CLAUDE.md v2.0 — Totum-Suite — Sistema Vibe Coding Totum — 2026-05-10*
