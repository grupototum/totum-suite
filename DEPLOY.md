# 🚀 Deploy do Totum-Suite

## 1. Criar banco MongoDB (MongoDB Atlas)

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas) e crie uma conta (gratuito)
2. Crie um **novo cluster** (M0 — Shared, gratuito)
3. Em **Database Access**, crie um usuário com senha
4. Em **Network Access**, adicione `0.0.0.0/0` (acesso de qualquer IP)
5. Vá em **Clusters → Connect → Drivers → Python**
6. Copie a URL de conexão, substitua `<password>` pela senha do usuário
7. Guarde essa URL — ela será a `MONGO_URL`

> Exemplo: `mongodb+srv://meuusuario:minhasenha@cluster0.xxxxx.mongodb.net/totum_suite?retryWrites=true&w=majority`

---

## 2. Deploy do backend no Render

**Opção A — Blueprint (recomendado):**

Clique no botão abaixo (ou acesse o Render Dashboard e importe o repo):

```
1. No Render Dashboard, clique em "Blueprints"
2. Conecte seu repositório github.com/grupototum/totum-suite
3. O Render vai ler o arquivo render.yaml
4. Preencha a variável MONGO_URL com a URL do Atlas
5. Clique em "Apply"
```

**Opção B — Manual:**

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. **New → Web Service**
3. Conecte o repositório `grupototum/totum-suite`
4. Configure:
   - **Name:** `totum-suite-api`
   - **Runtime:** `Docker`
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `./Dockerfile`
5. Em **Environment Variables**, adicione:
   - `MONGO_URL` = URL do MongoDB Atlas
   - `DB_NAME` = `totum_suite`
   - `JWT_SECRET` = uma string aleatória forte (mínimo 32 caracteres)
   - `CORS_ORIGINS` = `*` (ou a URL do seu frontend no Vercel)
   - `ADMIN_EMAIL` = `admin@mixpost.app`
   - `ADMIN_PASSWORD` = `admin123`
   - `TEST_USER_EMAIL` = `user@mixpost.app`
   - `TEST_USER_PASSWORD` = `user123`
6. Clique em **Create Web Service**

---

## 3. Configurar o frontend no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Entre no projeto **totum-suite**
3. Vá em **Settings → Environment Variables**
4. Adicione:
   - `REACT_APP_BACKEND_URL` = URL do backend no Render (ex: `https://totum-suite-api.onrender.com`)
5. Clique em **Save**
6. Vá em **Deployments** e faça **Redeploy** do último deploy

---

## 4. Acessar o sistema

Após o redeploy do frontend:

- URL do frontend: `https://totum-suite-xxx.vercel.app`
- Faça login com:
  - **Admin:** `admin@mixpost.app` / `admin123`
  - **Usuário:** `user@mixpost.app` / `user123`

---

## ⚠️ Dicas importantes

- O tier gratuito do Render "dorme" após 15 min de inatividade. A primeira requisição pode demorar ~30s para "acordar".
- Se quiser evitar isso, use o plano pago do Render ou configure um ping periódico (UptimeRobot, etc.).
- Certifique-se de que o CORS está configurado corretamente: se o frontend der erro de CORS, atualize a variável `CORS_ORIGINS` no Render para a URL exata do Vercel.
