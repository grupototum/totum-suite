import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Send, Trash2 } from "lucide-react";

const STATUSES = [
    { id: "all", label: "Todos" },
    { id: "draft", label: "Rascunhos" },
    { id: "scheduled", label: "Agendados" },
    { id: "published", label: "Publicados" },
    { id: "failed", label: "Falhos" },
];

export default function PostsPage() {
    const { activeWorkspace } = useAuth();
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!activeWorkspace) return;
        setLoading(true);
        const params = { workspace_id: activeWorkspace.workspace_id };
        if (filter !== "all") params.status = filter;
        const { data } = await api.get("/posts", { params });
        setPosts(data);
        setLoading(false);
    }, [activeWorkspace, filter]);

    useEffect(() => {
        load().catch(() => {
            setPosts([]);
            setLoading(false);
        });
    }, [load]);

    const publish = async (id) => {
        await api.post(`/posts/${id}/publish`);
        load();
    };
    const remove = async (id) => {
        if (!window.confirm("Excluir este post?")) return;
        await api.delete(`/posts/${id}`);
        load();
    };

    return (
        <div className="p-8 space-y-6" data-testid="posts-page">
            <header>
                <div className="label-overline mb-2">biblioteca</div>
                <h1 className="font-display text-5xl tracking-tighter">Posts.</h1>
            </header>

            <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setFilter(s.id)}
                        data-testid={`filter-${s.id}`}
                        className={`mp-pill ${filter === s.id ? "bg-[var(--mp-primary)] text-white border-[var(--mp-primary)]" : ""}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="mp-card overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-[var(--mp-muted)]">Carregando…</div>
                ) : posts.length === 0 ? (
                    <div className="p-10 text-center text-[var(--mp-muted)]">Nenhum post encontrado.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--mp-surface-2)] text-[var(--mp-muted)] border-b border-[var(--mp-border)]">
                            <tr>
                                <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Status</th>
                                <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Conteúdo</th>
                                <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Quando</th>
                                <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Métricas</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((p) => (
                                <tr
                                    key={p.post_id}
                                    className="border-t border-[var(--mp-border)] hover:bg-[var(--mp-surface-2)] transition-colors"
                                    data-testid={`post-row-${p.post_id}`}
                                >
                                    <td className="p-3">
                                        <span
                                            className={`mp-pill ${
                                                p.status === "published"
                                                    ? "bg-[var(--mp-success)] text-white border-[var(--mp-success)]"
                                                    : p.status === "scheduled"
                                                      ? "bg-[var(--mp-primary)] text-white border-[var(--mp-primary)]"
                                                      : p.status === "failed"
                                                        ? "bg-[var(--mp-error)] text-white border-[var(--mp-error)]"
                                                        : ""
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-3 max-w-md">
                                        <p className="line-clamp-2">{p.content}</p>
                                    </td>
                                    <td className="p-3 text-xs font-mono whitespace-nowrap">
                                        {p.published_at
                                            ? new Date(p.published_at).toLocaleString("pt-BR")
                                            : p.scheduled_at
                                              ? new Date(p.scheduled_at).toLocaleString("pt-BR")
                                              : new Date(p.created_at).toLocaleString("pt-BR")}
                                    </td>
                                    <td className="p-3 text-xs font-mono">
                                        {p.metrics?.impressions ? (
                                            <>
                                                <span className="block">{p.metrics.impressions} imp</span>
                                                <span className="block text-[var(--mp-muted)]">
                                                    {p.metrics.engagements} eng · {p.metrics.clicks} clk
                                                </span>
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="p-3 flex gap-2 justify-end">
                                        {p.status !== "published" && (
                                            <button
                                                onClick={() => publish(p.post_id)}
                                                className="mp-btn h-8 px-3 text-xs"
                                                data-testid={`publish-${p.post_id}`}
                                            >
                                                <Send size={12} /> Publicar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => remove(p.post_id)}
                                            className="mp-btn mp-btn-danger h-8 px-3 text-xs"
                                            data-testid={`delete-${p.post_id}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
