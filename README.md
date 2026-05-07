# Totum Suite — Social Media OS

SaaS de gestão de mídias sociais para social media managers, agências e times de marketing. Planeje, componha, agende e analise conteúdo em múltiplas redes a partir de um único cockpit.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + CRA + Craco + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python 3.11 + Pydantic v2 |
| Banco | MongoDB (motor async via Motor) |
| Auth | JWT próprio (cookie httpOnly) + Google OAuth (Emergent Auth) |
| Deploy | Vercel (frontend) + Render (backend Docker) |
| Domínio | suite.grupototum.com |

## Estrutura de pastas

```
Totum-Suite/
├── docs/               # Documentação do projeto
├── frontend/           # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/   # Componentes próprios + shadcn/ui
│   │   ├── contexts/     # AuthContext
│   │   ├── hooks/        # use-toast
│   │   ├── lib/          # api.js, utils.js
│   │   └── pages/        # 8 páginas principais
│   ├── craco.config.js
│   └── package.json
├── backend/            # FastAPI monolito (em refatoração)
│   ├── server.py         # 25 endpoints, 7 collections
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── scripts/            # Utilitários (seed, backup, etc.)
├── render.yaml         # Blueprint do Render
└── vercel.json         # Config do Vercel
```

## Como rodar local

### Pré-requisitos
- Node.js 18+ + Yarn
- Python 3.11+ + pip
- MongoDB local ou MongoDB Atlas

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edite .env com sua MONGO_URL e JWT_SECRET
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# Edite .env com REACT_APP_BACKEND_URL=http://localhost:8000
yarn install
yarn start
```

## Credenciais de teste (seed automático)

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@mixpost.app` | `admin123` |
| Usuário | `user@mixpost.app` | `user123` |

O seed roda automaticamente no startup do backend.

## Scripts úteis

```bash
# Testes backend
cd backend && pytest tests/test_mixpost_api.py -v

# Build frontend
cd frontend && yarn build

# Deploy backend (Render)
# Configure MONGO_URL e JWT_SECRET no dashboard do Render
```

## Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitetura técnica e decisões
- [CLAUDE.md](./CLAUDE.md) — Contexto completo para Claude Code
- [KIMI.md](./KIMI.md) — Contexto para Kimi Code
- [TODO.md](./TODO.md) — Backlog e próximas melhorias
- [BUGS.md](./BUGS.md) — Issues conhecidas
- [CHANGELOG.md](./CHANGELOG.md) — Histórico de mudanças
- [docs/DEPLOY.md](./docs/DEPLOY.md) — Guia de deploy passo a passo
- [docs/AUTH_TESTING.md](./docs/AUTH_TESTING.md) — Playbook de testes de auth

## Status do projeto

- **Frontend:** Deployado no Vercel ✅
- **Backend:** Dockerfile e render.yaml prontos; aguardando configuração de MONGO_URL no Render
- **Domínio:** suite.grupototum.com configurado no Vercel
- **Testes backend:** 17/17 passando
- **Testes frontend:** Em desenvolvimento

## Equipe / Contato

Desenvolvido pelo time Totum.
