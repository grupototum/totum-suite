import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

const PROVIDER_LABEL = {
    twitter: "X / Twitter",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
};

export default function AnalyticsPage() {
    const { activeWorkspace } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!activeWorkspace) return;
        api.get("/analytics/summary", {
            params: { workspace_id: activeWorkspace.workspace_id },
        }).then((r) => setData(r.data));
    }, [activeWorkspace]);

    if (!data) return <div className="p-8" data-testid="analytics-loading">Carregando…</div>;

    const totals = data.totals || {};
    const cards = [
        { label: "Impressões", v: totals.impressions || 0 },
        { label: "Engajamentos", v: totals.engagements || 0 },
        { label: "Cliques", v: totals.clicks || 0 },
        { label: "Curtidas", v: totals.likes || 0 },
        { label: "Compartilham.", v: totals.shares || 0 },
        { label: "Comentários", v: totals.comments || 0 },
    ];

    return (
        <div className="p-8 space-y-6" data-testid="analytics-page">
            <header>
                <div className="label-overline mb-2">desempenho</div>
                <h1 className="font-display text-5xl tracking-tighter">Analytics.</h1>
            </header>

            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map((c, i) => (
                    <div key={c.label} className="mp-card p-4" data-testid={`metric-${i}`}>
                        <div className="label-overline text-[var(--mp-muted)]">{c.label}</div>
                        <div className="font-display text-2xl mt-1">{c.v.toLocaleString("pt-BR")}</div>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="mp-card p-5">
                    <div className="label-overline mb-3">por rede</div>
                    {data.by_provider.length === 0 ? (
                        <p className="text-sm text-[var(--mp-muted)]">Sem dados ainda.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.by_provider}>
                                <CartesianGrid stroke="#0a0a0a22" strokeDasharray="2 2" />
                                <XAxis
                                    dataKey="provider"
                                    tickFormatter={(v) => PROVIDER_LABEL[v] || v}
                                    tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                                    stroke="#0a0a0a"
                                />
                                <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} stroke="#0a0a0a" />
                                <Tooltip
                                    contentStyle={{ border: "1px solid #0a0a0a", borderRadius: 0, background: "#fff" }}
                                />
                                <Bar dataKey="impressions" fill="#002FA7" />
                                <Bar dataKey="engagements" fill="#FFCC00" stroke="#0a0a0a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </section>

                <section className="mp-card p-5">
                    <div className="label-overline mb-3">evolução diária</div>
                    {data.daily.length === 0 ? (
                        <p className="text-sm text-[var(--mp-muted)]">Sem dados ainda.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data.daily}>
                                <CartesianGrid stroke="#0a0a0a22" strokeDasharray="2 2" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}
                                    stroke="#0a0a0a"
                                />
                                <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} stroke="#0a0a0a" />
                                <Tooltip
                                    contentStyle={{ border: "1px solid #0a0a0a", borderRadius: 0, background: "#fff" }}
                                />
                                <Line type="monotone" dataKey="impressions" stroke="#002FA7" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="engagements" stroke="#FF2A2A" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="clicks" stroke="#00A35C" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </section>
            </div>

            <section className="mp-card">
                <div className="p-5 border-b border-black">
                    <div className="label-overline">top posts</div>
                    <h2 className="font-display text-2xl">Maior engajamento</h2>
                </div>
                {data.top_posts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--mp-muted)]">
                        Publique posts para ver o ranking.
                    </div>
                ) : (
                    <ul>
                        {data.top_posts.map((p, i) => (
                            <li
                                key={p.post_id}
                                className="p-5 border-b border-black/10 last:border-0 flex items-start gap-4"
                                data-testid={`top-post-${i}`}
                            >
                                <div className="font-display text-3xl w-10">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">{p.content}</p>
                                    <div className="text-xs font-mono text-[var(--mp-muted)] mt-1">
                                        {(p.metrics?.impressions || 0).toLocaleString("pt-BR")} imp ·{" "}
                                        {(p.metrics?.engagements || 0).toLocaleString("pt-BR")} eng ·{" "}
                                        {(p.metrics?.clicks || 0).toLocaleString("pt-BR")} clk
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
