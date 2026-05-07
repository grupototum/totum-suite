# BUGS — Issues Conhecidas

## Ativos

### BUG-001: Backend não deployado
- **Descrição:** O backend FastAPI não está rodando no Render. Falta configurar a variável `MONGO_URL`.
- **Impacto:** Sistema inoperante para dados reais. Auth, posts, analytics — tudo falha.
- **Workaround:** Modo demo ativado no frontend (usuário mock fixo).
- **Status:** Aguardando configuração do usuário no Render Dashboard.

### BUG-002: Modo demo inseguro
- **Descrição:** AuthContext foi modificado para sempre retornar um usuário mock (`admin@mixpost.app`). Qualquer pessoa acessa a plataforma sem login.
- **Impacto:** Segurança zero. Dados expostos.
- **Workaround:** Nenhum — é intencional até backend voltar.
- **Status:** Deve ser revertido assim que backend estiver deployado.

### BUG-003: Funcionalidade de IA inoperante
- **Descrição:** Pacote `emergentintegrations` era privado e foi removido do `requirements.txt`. O endpoint `/api/ai/suggest` retorna 503 quando não instalado.
- **Impacto:** Composer não gera sugestões de legenda com IA.
- **Workaround:** Usar campo de texto manualmente.
- **Status:** Aguardando decisão: reinstalar pacote privado ou migrar para OpenAI/Anthropic direto.

### BUG-004: Design system inconsistente
- **Descrição:** `design_guidelines.json` define paleta Swiss/Brutalist (azul IKB + amarelo), mas o CSS atual usa vermelho cereja `#E63946` (marca Totum). Alguns elementos ainda podem referenciar cores antigas.
- **Impacto:** Baixo — visual funcional, mas não 100% alinhado com a marca.
- **Status:** Backlog P3.

## Resolvidos

### BUG-005: Loading infinito em páginas sem backend
- **Descrição:** Páginas faziam chamadas API sem `.catch()`, travando em "Carregando…" quando backend não respondia.
- **Páginas afetadas:** Analytics, Accounts, Calendar, Dashboard, Posts
- **Resolução:** Adicionado `.catch()` em todos os useEffect com chamadas API.
- **Commit:** `1a559dd`

### BUG-006: Badge "Made with Emergent"
- **Descrição:** Badge fixo no canto inferior direito do index.html.
- **Resolução:** Removido do `public/index.html`.
- **Commit:** `2f21bf5`

### BUG-007: Build quebrava no Vercel por warnings ESLint
- **Descrição:** `useEffect` missing dependency em AccountsPage e PostsPage. CI=true no Vercel transformava warnings em erros.
- **Resolução:** Adicionado `useCallback` nas funções `load` e `CI=false` no buildCommand.
- **Commit:** `1836106`

### BUG-008: Deploy falhava por vercel.json conflitante
- **Descrição:** `vercel.json` na raiz tinha `cd frontend && ...` mas o `rootDirectory` no Vercel já era `frontend`.
- **Resolução:** Removido `vercel.json`, configuração gerenciada via API do Vercel.
- **Commit:** `39a7b34`
