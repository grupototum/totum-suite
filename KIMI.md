# KIMI.md — Contexto para Kimi Code

## O que você vai encontrar aqui

Este é um projeto React 19 (CRA + Craco) com Tailwind CSS e shadcn/ui. É um SaaS de gestão de mídias sociais em português (Brasil).

## Como o frontend está organizado

```
frontend/src/
├── components/
│   ├── ui/               # ~50 componentes shadcn/ui (não mexa na estrutura interna)
│   ├── Brand.js          # Logo da Totum
│   ├── Layout.js         # Sidebar + header + outlet
│   └── ProtectedRoute.js # Guard de rotas
├── contexts/
│   └── AuthContext.js    # Estado global de auth + workspaces
├── hooks/
│   └── use-toast.js      # Hook de toast (shadcn)
├── lib/
│   ├── api.js            # Axios com baseURL e interceptors
│   └── utils.js          # cn() e helpers
├── pages/
│   ├── LoginPage.js      # Login/Register + Google OAuth
│   ├── AuthCallback.js   # Callback do Google (session_id)
│   ├── DashboardPage.js  # Cards de resumo, posts recentes
│   ├── ComposerPage.js   # Editor de post + preview + AI suggest
│   ├── CalendarPage.js   # Calendário mensal com posts
│   ├── PostsPage.js      # Listagem com filtros + ações
│   ├── AccountsPage.js   # Contas sociais (mock)
│   ├── AnalyticsPage.js  # Gráficos Recharts + métricas
│   └── SettingsPage.js   # Workspaces CRUD
├── App.js                # Rotas (BrowserRouter)
├── index.css             # Variáveis CSS + Tailwind directives
└── App.css               # Estilos globais mínimos
```

## Regras de estilo (Tailwind + CSS custom)

O projeto usa variáveis CSS definidas em `index.css`. As principais:

```css
--mp-bg: #0a0a0a;           /* Fundo principal (dark) */
--mp-surface: #18181b;      /* Cards/painéis */
--mp-surface-2: #27272a;    /* Hover/seleção */
--mp-border: rgba(235,235,235,0.18);
--mp-border-strong: rgba(235,235,235,0.35);
--mp-text: #fafafa;
--mp-muted: #a1a1aa;
--mp-primary: #E63946;      /* Vermelho cereja Totum */
--mp-secondary: #002FA7;    /* Azul IKB (guia original) */
--mp-error: #FF2A2A;
--mp-success: #00A35C;
```

Classes utilitárias comuns:
- `.mp-card` — card padrão (bg, borda, sombra)
- `.mp-btn` — botão primário
- `.mp-btn-secondary` — botão outline
- `.mp-btn-ghost` — botão sem fundo
- `.mp-btn-danger` — botão vermelho
- `.mp-input` — input padrão
- `.mp-pill` — badge/tag
- `.label-overline` — label uppercase tracking-wide
- `.font-display` — Cabinet Grotesk

## API no frontend

```js
import { api } from "@/lib/api";

// Exemplo:
api.get("/posts", { params: { workspace_id: "..." }})
  .then(r => setPosts(r.data))
  .catch(() => setPosts([])); // SEMPRE use catch!
```

**Regra de ouro:** Toda chamada `api.get()`/`api.post()` dentro de `useEffect` DEVE ter `.catch()`. Se não tiver, a tela fica em "Carregando…" para sempre quando o backend não responde.

## Componentes shadcn/ui

Já instalados e funcionando. Não precisa reinstalar. Para usar:

```jsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
```

Lista completa em `frontend/src/components/ui/`.

## Páginas e rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | LoginPage | Login email/senha + Google |
| `/register` | LoginPage | Cadastro (mesmo componente, mode="register") |
| `/dashboard` | DashboardPage | Resumo + posts recentes |
| `/composer` | ComposerPage | Editor + preview + agendamento |
| `/calendar` | CalendarPage | Calendário mensal |
| `/posts` | PostsPage | Listagem + filtros |
| `/accounts` | AccountsPage | Contas sociais mock |
| `/analytics` | AnalyticsPage | Gráficos e métricas |
| `/settings` | SettingsPage | CRUD de workspaces |

Todas as rotas internas estão dentro de `<ProtectedRoute>` (exceto login/register).

## Estado global (AuthContext)

```js
const { user, workspaces, activeWorkspace, login, logout, switchWorkspace } = useAuth();
```

**Atenção:** O AuthContext está em modo demo. `user` é sempre um mock fixo (`admin@mixpost.app`). Isso foi feito porque o backend não está deployado. Quando o backend voltar, precisa reverter para auth real.

## Design tokens

- **Border radius:** `rounded-none` ou `rounded-[8px]` no máximo
- **Sombras:** Sólidas, nunca blur/gradiente. Ex: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Ícones:** lucide-react, strokeWidth 1.5 ou 2
- **Fonte headings:** Cabinet Grotesk (importada via Fontshare CDN)
- **Fonte body:** IBM Plex Sans (Google Fonts)

## Checklist ao alterar frontend

- [ ] Não quebrar build (`yarn build`)
- [ ] Preservar `data-testid` em elementos interativos
- [ ] Adicionar `.catch()` em chamadas API
- [ ] Usar variáveis CSS `--mp-*` em vez de cores hardcoded
- [ ] Manter consistência com design Swiss/Brutalist
- [ ] Commits pequenos e descritivos
