import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, formatApiError } from "@/lib/api";

const COLORS = ["#002FA7", "#FFCC00", "#FF2A2A", "#00A35C", "#0A0A0A", "#FF6B00"];

export default function SettingsPage() {
    const { user, workspaces, activeWorkspace, refreshWorkspaces, switchWorkspace } = useAuth();
    const [name, setName] = useState("");
    const [color, setColor] = useState("#002FA7");
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    const create = async (e) => {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        try {
            const { data } = await api.post("/workspaces", { name, color });
            await refreshWorkspaces();
            setName("");
            setMsg(`Workspace "${data.name}" criado.`);
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail));
        }
    };

    const remove = async (id) => {
        if (workspaces.length === 1) {
            alert("Você precisa ter pelo menos um workspace.");
            return;
        }
        if (!window.confirm("Excluir este workspace e todos os seus posts?")) return;
        try {
            await api.delete(`/workspaces/${id}`);
            await refreshWorkspaces();
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail));
        }
    };

    return (
        <div className="p-8 space-y-6" data-testid="settings-page">
            <header>
                <div className="label-overline mb-2">configurações</div>
                <h1 className="font-display text-5xl tracking-tighter">Ajustes.</h1>
            </header>

            <section className="grid lg:grid-cols-2 gap-6">
                <div className="mp-card p-6">
                    <div className="label-overline mb-2">perfil</div>
                    <h2 className="font-display text-2xl mb-4">Sua conta</h2>
                    <div className="space-y-3">
                        <div>
                            <div className="label-overline">Nome</div>
                            <div className="font-bold">{user?.name}</div>
                        </div>
                        <div>
                            <div className="label-overline">Email</div>
                            <div className="font-mono text-sm">{user?.email}</div>
                        </div>
                        <div>
                            <div className="label-overline">Provedor</div>
                            <span className="mp-pill bg-[var(--mp-secondary)]">
                                {user?.auth_provider === "google" ? "Google" : "Email/senha"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mp-card p-6">
                    <div className="label-overline mb-2">criar</div>
                    <h2 className="font-display text-2xl mb-4">Novo workspace</h2>
                    <form onSubmit={create} className="space-y-3">
                        <input
                            data-testid="settings-ws-name"
                            className="mp-input"
                            placeholder="Nome do workspace"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <div>
                            <div className="label-overline mb-2">Cor</div>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        type="button"
                                        key={c}
                                        onClick={() => setColor(c)}
                                        data-testid={`color-${c}`}
                                        className={`w-8 h-8 rounded-[6px] border border-[var(--mp-border-strong)] ${color === c ? "ring-2 ring-offset-2 ring-offset-[var(--mp-surface)] ring-[var(--mp-primary)]" : ""}`}
                                        style={{ background: c, borderColor: "var(--mp-border-strong)" }}
                                    />
                                ))}
                            </div>
                        </div>
                        {msg && <div className="text-[var(--mp-success)] text-sm">{msg}</div>}
                        {err && <div className="text-[var(--mp-error)] text-sm">{err}</div>}
                        <button type="submit" className="mp-btn" data-testid="settings-create-ws-btn">
                            Criar workspace
                        </button>
                    </form>
                </div>
            </section>

            <section className="mp-card">
                <div className="p-5 border-b border-[var(--mp-border)]">
                    <div className="label-overline">workspaces</div>
                    <h2 className="font-display text-2xl">Seus espaços</h2>
                </div>
                <ul>
                    {workspaces.map((w) => (
                        <li
                            key={w.workspace_id}
                            className="p-4 border-b border-[var(--mp-border)] last:border-0 flex items-center gap-3"
                            data-testid={`ws-row-${w.workspace_id}`}
                        >
                            <span className="w-5 h-5 rounded-[4px] border border-[var(--mp-border-strong)]" style={{ background: w.color }} />
                            <div className="flex-1 font-bold">{w.name}</div>
                            {activeWorkspace?.workspace_id === w.workspace_id ? (
                                <span className="mp-pill bg-[var(--mp-primary)] text-white border-[var(--mp-primary)]">ativo</span>
                            ) : (
                                <button
                                    onClick={() => switchWorkspace(w.workspace_id)}
                                    className="mp-btn mp-btn-secondary h-8 px-3 text-xs"
                                    data-testid={`activate-${w.workspace_id}`}
                                >
                                    Ativar
                                </button>
                            )}
                            <button
                                onClick={() => remove(w.workspace_id)}
                                className="mp-btn mp-btn-danger h-8 px-3 text-xs"
                                data-testid={`delete-ws-${w.workspace_id}`}
                            >
                                Excluir
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
