# Variáveis de Ambiente

## Frontend (Vercel)

| Variável | Obrigatória | Valor exemplo | Descrição |
|----------|-------------|---------------|-----------|
| `REACT_APP_BACKEND_URL` | Sim | `https://totum-suite-api.onrender.com` | URL base do backend |

## Backend (Render)

| Variável | Obrigatória | Valor exemplo | Descrição |
|----------|-------------|---------------|-----------|
| `MONGO_URL` | Sim | `mongodb+srv://user:pass@cluster.mongodb.net/...` | Conexão MongoDB Atlas |
| `DB_NAME` | Sim | `totum_suite` | Nome do database |
| `JWT_SECRET` | Sim | `min-32-chars-random-string` | Chave secreta JWT |
| `CORS_ORIGINS` | Não | `*` ou `https://suite.grupototum.com` | Origens permitidas |
| `ADMIN_EMAIL` | Não | `admin@mixpost.app` | Email do admin (seed) |
| `ADMIN_PASSWORD` | Não | `admin123` | Senha do admin (seed) |
| `TEST_USER_EMAIL` | Não | `user@mixpost.app` | Email do usuário teste (seed) |
| `TEST_USER_PASSWORD` | Não | `user123` | Senha do usuário teste (seed) |
| `EMERGENT_LLM_KEY` | Não | `sk-...` | Chave para AI suggest (opcional) |

## URLs Importantes

- **Frontend produção:** https://suite.grupototum.com
- **Frontend Vercel:** https://totum-suite-*.vercel.app
- **Backend Render:** https://totum-suite-api.onrender.com
- **Repositório:** https://github.com/grupototum/totum-suite

## Como obter valores

### MONGO_URL
1. Crie cluster no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Database Access → crie usuário com senha
3. Network Access → adicione `0.0.0.0/0`
4. Clusters → Connect → Drivers → Python → copie a URL

### JWT_SECRET
Gere uma string aleatória forte (mínimo 32 caracteres):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```
