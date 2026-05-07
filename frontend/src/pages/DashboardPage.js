import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, FileText, Send, Calendar as Cal, AlertCircle, TrendingUp } from "lucide-react";

const PROVIDER_LABEL = {
    twitter: "X / Twitter",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
};

export default function DashboardPage() {
    const { activeWorkspace, user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        if (!activeWorkspace) return;
        const ws = activeWorkspace.workspace_id;
        Promise.all([
            api.get("/analytics/summary", { params: { workspace_id: ws } }),
            api.get("/social-accounts", { params: { workspace_id: ws } }),
            api.get("/posts", { params: { workspace_id: ws } }),
        ]).then(([s, a, p]) => {
            setSummary(s.data);
            setAccounts(a.data);
            setRecent(p.data.slice(0, 5));
        });
    }, [activeWorkspace]);

    if (!activeWorkspace) {
        return (
            <div className="p-8" data-testid="dashboard-empty">
                <div className="mp-card p-8">
                    <div className="label-overline mb-2">workspace</div>
                    <h1 className="font-display text-3xl mb-2">Sem workspace ativo</h1>
                    <p className="text-sm text-[var(--mp-muted)]">
                        Crie um workspace na barra lateral para começar.
                    </p>
                </div>
            </div>
        );
    }

    const cards = [
        { label: "Posts publicados", value: summary?.published_count ?? 0, icon: Send },
        { label: "Agendados", value: summary?.scheduled_count ?? 0, icon: Cal },
        { label: "Rascunhos", value: summary?.draft_count ?? 0, icon: FileText },
        { label: "Impressões totais", value: (summary?.totals?.impressions ?? 0).toLocaleString("pt-BR"), icon: TrendingUp },
    ];

    return (
        <div className="p-8 space-y-8" data-testid="dashboard-page">
            <header className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                    <div className="label-overline mb-2">olá, {user?.name?.split(" ")[0] || ""}</div>
                    <h1 className="font-display text-5xl tracking-tighter">Painel.</h1>
                    <p className="text-[var(--mp-muted)] mt-2 max-w-xl">
                        Visão geral de <span className="font-bold text-black">{activeWorkspace.name}</span>.
                        Publique, agende e acompanhe o desempenho.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/composer" className="mp-btn" data-testid="quick-compose-btn">
                        <FileText size={16} /> Novo post
                    </Link>
                    <Link to="/accounts" className="mp-btn mp-btn-secondary" data-testid="quick-accounts-btn">
                        Conectar conta
                    </Link>
                </div>
            </header>

            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className="mp-card p-5" data-testid={`kpi-card-${i}`}>
                        <div className="flex items-start justify-between">
                            <div className="label-overline text-[var(--mp-muted)]">{c.label}</div>
                            <c.icon size={18} />
                        </div>
                        <div className="font-display text-4xl mt-3">{c.value}</div>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent posts */}
                <section className="lg:col-span-2 mp-card">
                    <div className="p-5 border-b border-black flex items-center justify-between">
                        <h2 className="font-display text-2xl">Posts recentes</h2>
                        <Link to="/posts" className="text-sm flex items-center gap-1 hover:underline">
                            Ver todos <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <div className="p-10 text-center text-[var(--mp-muted)]">
                            <AlertCircle className="mx-auto mb-3" />
                            <p>Nenhum post ainda. Crie o primeiro pelo Compositor.</p>
                        </div>
                    ) : (
                        <ul>
                            {recent.map((p) => (
                                <li
                                    key={p.post_id}
                                    className="p-5 border-b border-black/10 last:border-0 flex items-start gap-4"
                                    data-testid={`recent-post-${p.post_id}`}
                                >
                                    <span
                                        className={`mp-pill ${
                                            p.status === "published"
                                                ? "bg-[var(--mp-success)] text-white border-[var(--mp-success)]"
                                                : p.status === "scheduled"
                                                  ? "bg-[var(--mp-secondary)]"
                                                  : p.status === "failed"
                                                    ? "bg-[var(--mp-error)] text-white border-[var(--mp-error)]"
                                                    : "bg-white"
                                        }`}
                                    >
                                        {p.status}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed line-clamp-2">{p.content}</p>
                                        <div className="text-xs text-[var(--mp-muted)] mt-1">
                                            {new Date(p.created_at).toLocaleString("pt-BR")}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Connected accounts */}
                <section className="mp-card">
                    <div className="p-5 border-b border-black flex items-center justify-between">
                        <h2 className="font-display text-2xl">Contas</h2>
                        <Link to="/accounts" className="text-sm flex items-center gap-1 hover:underline">
                            Gerenciar <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    {accounts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--mp-muted)]">
                            Nenhuma conta conectada.
                        </div>
                    ) : (
                        <ul>
                            {accounts.map((a) => (
                                <li
                                    key={a.account_id}
                                    className="p-4 border-b border-black/10 last:border-0 flex items-center gap-3"
                                >
                                    <span className="w-9 h-9 border border-black bg-[var(--mp-secondary)] flex items-center justify-center text-xs font-bold uppercase">
                                        {a.provider[0]}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate">@{a.handle}</div>
                                        <div className="text-xs text-[var(--mp-muted)]">
                                            {PROVIDER_LABEL[a.provider]}
                                        </div>
                                    </div>
                                    <span className="mp-pill bg-[var(--mp-success)] text-white border-[var(--mp-success)]">
                                        ativa
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
