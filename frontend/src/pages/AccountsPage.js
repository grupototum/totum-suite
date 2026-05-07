import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Twitter, Facebook, Instagram, Linkedin, Plus, Trash2 } from "lucide-react";

const PROVIDERS = [
    { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
    { id: "instagram", label: "Instagram", icon: Instagram, color: "#E4405F" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
];

export default function AccountsPage() {
    const { activeWorkspace } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [provider, setProvider] = useState(null);
    const [handle, setHandle] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [err, setErr] = useState(null);

    const load = async () => {
        if (!activeWorkspace) return;
        const { data } = await api.get("/social-accounts", {
            params: { workspace_id: activeWorkspace.workspace_id },
        });
        setAccounts(data);
    };

    useEffect(() => {
        load();
    }, [activeWorkspace]);

    const connect = async (e) => {
        e.preventDefault();
        setErr(null);
        try {
            await api.post("/social-accounts", {
                workspace_id: activeWorkspace.workspace_id,
                provider,
                handle: handle.replace(/^@/, ""),
                display_name: displayName || handle,
            });
            setShowModal(false);
            setProvider(null);
            setHandle("");
            setDisplayName("");
            load();
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail));
        }
    };

    const disconnect = async (id) => {
        if (!window.confirm("Desconectar esta conta?")) return;
        await api.delete(`/social-accounts/${id}`);
        load();
    };

    return (
        <div className="p-8 space-y-6" data-testid="accounts-page">
            <header className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <div className="label-overline mb-2">redes</div>
                    <h1 className="font-display text-5xl tracking-tighter">Contas conectadas.</h1>
                    <p className="text-[var(--mp-muted)] mt-2 max-w-xl text-sm">
                        Gerencie todas as suas contas em um só lugar. Conexões reais ficarão disponíveis em breve —
                        no momento, são contas mock para você testar todo o fluxo.
                    </p>
                </div>
            </header>

            {/* Connect cards */}
            <section>
                <div className="label-overline mb-3">conectar nova rede</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PROVIDERS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                setProvider(p.id);
                                setShowModal(true);
                            }}
                            data-testid={`connect-${p.id}-btn`}
                            className="mp-card mp-card-hover p-5 text-left"
                        >
                            <div
                                className="w-10 h-10 rounded-[8px] border border-[var(--mp-border-strong)] flex items-center justify-center mb-3"
                                style={{ background: p.color, color: "#fff" }}
                            >
                                <p.icon size={18} />
                            </div>
                            <div className="font-display text-xl">{p.label}</div>
                            <div className="text-xs text-[var(--mp-muted)] mt-1 flex items-center gap-1">
                                <Plus size={12} /> Conectar conta
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Connected list */}
            <section>
                <div className="label-overline mb-3">conectadas</div>
                {accounts.length === 0 ? (
                    <div className="mp-card p-10 text-center text-sm text-[var(--mp-muted)]">
                        Nenhuma conta conectada ainda.
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map((a) => {
                            const meta = PROVIDERS.find((p) => p.id === a.provider);
                            return (
                                <div
                                    key={a.account_id}
                                    className="mp-card p-5 flex items-start gap-3"
                                    data-testid={`account-card-${a.account_id}`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-[8px] border border-[var(--mp-border-strong)] flex items-center justify-center"
                                        style={{ background: meta?.color, color: "#fff" }}
                                    >
                                        {meta && <meta.icon size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">@{a.handle}</div>
                                        <div className="text-xs text-[var(--mp-muted)]">{meta?.label}</div>
                                        <div className="mt-1">
                                            <span className="mp-pill bg-[var(--mp-success)] text-white border-[var(--mp-success)] !text-[10px]">
                                                conectada · mock
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => disconnect(a.account_id)}
                                        className="mp-btn mp-btn-ghost h-8 w-8 p-0"
                                        title="Desconectar"
                                        data-testid={`disconnect-${a.account_id}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowModal(false)}
                    data-testid="connect-modal"
                >
                    <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={connect}
                        className="mp-card mp-shadow-soft p-6 w-full max-w-md"
                    >
                        <div className="label-overline mb-2">conectar</div>
                        <h3 className="font-display text-2xl mb-4">
                            {PROVIDERS.find((p) => p.id === provider)?.label}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label-overline block mb-2">@handle</label>
                                <input
                                    data-testid="connect-handle-input"
                                    className="mp-input"
                                    placeholder="seuhandle"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label-overline block mb-2">Nome de exibição</label>
                                <input
                                    data-testid="connect-display-input"
                                    className="mp-input"
                                    placeholder="Sua marca"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                            {err && <div className="text-[var(--mp-error)] text-sm">{err}</div>}
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="mp-btn flex-1" data-testid="confirm-connect-btn">
                                    Conectar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="mp-btn mp-btn-ghost"
                                >
                                    Cancelar
                                </button>
                            </div>
                            <p className="text-xs text-[var(--mp-muted)]">
                                Conexão mock — não envia dados para a rede real.
                            </p>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
