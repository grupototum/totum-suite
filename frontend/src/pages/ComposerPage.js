import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Sparkles, Send, Save, Calendar as Cal, X, Image as ImageIcon } from "lucide-react";

const NETWORKS = [
    { id: "twitter", label: "X / Twitter", limit: 280 },
    { id: "facebook", label: "Facebook", limit: 5000 },
    { id: "instagram", label: "Instagram", limit: 2200 },
    { id: "linkedin", label: "LinkedIn", limit: 3000 },
];

const MODELS = [
    { id: "gpt-4o-mini", label: "GPT-4o mini (rápido)" },
    { id: "gpt-5.2", label: "GPT-5.2" },
    { id: "claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

export default function ComposerPage() {
    const { activeWorkspace } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [content, setContent] = useState("");
    const [selected, setSelected] = useState(new Set());
    const [media, setMedia] = useState([]);
    const [scheduleAt, setScheduleAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(null);

    // AI panel
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("engajado");
    const [model, setModel] = useState("gpt-4o-mini");
    const [aiLoading, setAiLoading] = useState(false);
    const [variations, setVariations] = useState([]);
    const [aiErr, setAiErr] = useState(null);

    useEffect(() => {
        if (!activeWorkspace) return;
        api.get("/social-accounts", { params: { workspace_id: activeWorkspace.workspace_id } })
            .then((r) => setAccounts(r.data))
            .catch(() => setAccounts([]));
    }, [activeWorkspace]);

    const toggleAccount = (id) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const selectedNetworks = Array.from(
        new Set(accounts.filter((a) => selected.has(a.account_id)).map((a) => a.provider))
    );

    const lowestLimit = Math.min(
        ...NETWORKS.filter((n) => selectedNetworks.includes(n.id)).map((n) => n.limit),
        Infinity,
    );

    const submit = async (status) => {
        if (!activeWorkspace) return;
        setErr(null);
        setOk(null);
        if (!content.trim()) {
            setErr("Escreva o conteúdo do post.");
            return;
        }
        if (status === "scheduled" && !scheduleAt) {
            setErr("Escolha uma data/hora para agendar.");
            return;
        }
        setSaving(true);
        try {
            const body = {
                workspace_id: activeWorkspace.workspace_id,
                content,
                account_ids: Array.from(selected),
                media_urls: media,
                scheduled_at: status === "scheduled" ? new Date(scheduleAt).toISOString() : null,
                status,
            };
            const { data } = await api.post("/posts", body);
            if (status === "published") {
                await api.post(`/posts/${data.post_id}/publish`);
                setOk("Post publicado (mock) com sucesso.");
            } else if (status === "scheduled") {
                setOk("Post agendado com sucesso.");
            } else {
                setOk("Rascunho salvo.");
            }
            setContent("");
            setMedia([]);
            setSelected(new Set());
            setScheduleAt("");
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const askAI = async () => {
        setAiErr(null);
        if (!topic.trim()) {
            setAiErr("Diga sobre o que é o post.");
            return;
        }
        setAiLoading(true);
        try {
            const { data } = await api.post("/ai/suggest", {
                topic,
                tone,
                networks: selectedNetworks.length ? selectedNetworks : ["twitter"],
                model,
            });
            setVariations(data.variations || []);
        } catch (ex) {
            setAiErr(formatApiError(ex.response?.data?.detail));
        } finally {
            setAiLoading(false);
        }
    };

    const applyVariation = (v) => {
        const tags = (v.hashtags || []).join(" ");
        setContent(`${v.caption}${tags ? "\n\n" + tags : ""}`);
    };

    const addMedia = () => {
        const url = window.prompt("URL da imagem (cole um link público)");
        if (url) setMedia([...media, url]);
    };

    return (
        <div className="p-8 space-y-6" data-testid="composer-page">
            <header className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <div className="label-overline mb-2">compositor</div>
                    <h1 className="font-display text-5xl tracking-tighter">Novo Post.</h1>
                </div>
                <div className="text-sm text-[var(--mp-muted)]">
                    {selectedNetworks.length > 0
                        ? `Limite efetivo: ${lowestLimit === Infinity ? "—" : lowestLimit + " caracteres"}`
                        : "Selecione contas para ver limites"}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor */}
                <section className="lg:col-span-2 mp-card p-5 space-y-4">
                    <div>
                        <div className="label-overline mb-2">contas</div>
                        <div className="flex flex-wrap gap-2">
                            {accounts.length === 0 && (
                                <span className="text-sm text-[var(--mp-muted)]">
                                    Nenhuma conta conectada. Vá em <b>Contas</b>.
                                </span>
                            )}
                            {accounts.map((a) => (
                                <button
                                    key={a.account_id}
                                    onClick={() => toggleAccount(a.account_id)}
                                    data-testid={`account-toggle-${a.account_id}`}
                                    className={`mp-pill ${
                                        selected.has(a.account_id)
                                            ? "bg-black text-white border-black"
                                            : "bg-white"
                                    }`}
                                >
                                    @{a.handle}
                                    <span className="ml-1 text-[10px] opacity-60">{a.provider}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-end justify-between mb-2">
                            <div className="label-overline">conteúdo</div>
                            <div className="text-xs font-mono">
                                {content.length}
                                {lowestLimit !== Infinity && (
                                    <span className={content.length > lowestLimit ? "text-[var(--mp-error)]" : "text-[var(--mp-muted)]"}>
                                        /{lowestLimit}
                                    </span>
                                )}
                            </div>
                        </div>
                        <textarea
                            data-testid="composer-textarea"
                            className="mp-textarea"
                            placeholder="O que você quer compartilhar hoje?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* Media */}
                    <div>
                        <div className="label-overline mb-2">mídia (URLs)</div>
                        <div className="flex flex-wrap gap-2">
                            {media.map((u, i) => (
                                <div key={i} className="mp-card relative w-24 h-24 overflow-hidden">
                                    <img src={u} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setMedia(media.filter((_, idx) => idx !== i))}
                                        className="absolute top-0 right-0 w-6 h-6 bg-black text-white flex items-center justify-center"
                                        data-testid={`remove-media-${i}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addMedia}
                                data-testid="add-media-btn"
                                className="w-24 h-24 border border-black bg-white hover:bg-[var(--mp-secondary)] flex flex-col items-center justify-center text-xs gap-1"
                            >
                                <ImageIcon size={18} /> Adicionar
                            </button>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <div className="label-overline mb-2">agendar para</div>
                            <input
                                data-testid="composer-schedule"
                                type="datetime-local"
                                className="mp-input"
                                value={scheduleAt}
                                onChange={(e) => setScheduleAt(e.target.value)}
                            />
                        </div>
                    </div>

                    {err && <div className="border border-[var(--mp-error)] text-[var(--mp-error)] p-3 text-sm" data-testid="composer-error">{err}</div>}
                    {ok && <div className="border border-[var(--mp-success)] text-[var(--mp-success)] p-3 text-sm" data-testid="composer-ok">{ok}</div>}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-black/10">
                        <button
                            onClick={() => submit("draft")}
                            disabled={saving}
                            className="mp-btn mp-btn-secondary"
                            data-testid="save-draft-btn"
                        >
                            <Save size={16} /> Salvar rascunho
                        </button>
                        <button
                            onClick={() => submit("scheduled")}
                            disabled={saving}
                            className="mp-btn mp-btn-secondary"
                            data-testid="schedule-btn"
                        >
                            <Cal size={16} /> Agendar
                        </button>
                        <button
                            onClick={() => submit("published")}
                            disabled={saving}
                            className="mp-btn"
                            data-testid="publish-now-btn"
                        >
                            <Send size={16} /> Publicar agora
                        </button>
                    </div>
                </section>

                {/* Right: AI + Preview */}
                <aside className="space-y-6">
                    <div className="mp-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={18} className="text-[var(--mp-primary)]" />
                            <h3 className="font-display text-xl">Sugestão de IA</h3>
                        </div>
                        <input
                            data-testid="ai-topic-input"
                            className="mp-input mb-2"
                            placeholder="Sobre o que escrever?"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                                data-testid="ai-tone-select"
                                className="mp-input"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                <option value="engajado">Engajado</option>
                                <option value="profissional">Profissional</option>
                                <option value="divertido">Divertido</option>
                                <option value="urgente">Urgente</option>
                                <option value="inspirador">Inspirador</option>
                            </select>
                            <select
                                data-testid="ai-model-select"
                                className="mp-input"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            >
                                {MODELS.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={askAI}
                            disabled={aiLoading}
                            className="mp-btn w-full"
                            data-testid="ai-generate-btn"
                        >
                            {aiLoading ? "Gerando…" : "Gerar variações"}
                        </button>
                        {aiErr && (
                            <div className="text-sm text-[var(--mp-error)] mt-2" data-testid="ai-error">
                                {aiErr}
                            </div>
                        )}
                        {variations.length > 0 && (
                            <ul className="mt-4 space-y-3">
                                {variations.map((v, i) => (
                                    <li key={i} className="border border-black p-3" data-testid={`ai-variation-${i}`}>
                                        <p className="text-sm leading-relaxed mb-2">{v.caption}</p>
                                        <div className="text-xs text-[var(--mp-primary)] font-mono mb-2">
                                            {(v.hashtags || []).join(" ")}
                                        </div>
                                        <button
                                            onClick={() => applyVariation(v)}
                                            className="mp-btn mp-btn-secondary h-8 px-3 text-xs"
                                            data-testid={`ai-use-variation-${i}`}
                                        >
                                            Usar este
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mp-card p-5">
                        <div className="label-overline mb-3">preview</div>
                        {selectedNetworks.length === 0 && (
                            <p className="text-sm text-[var(--mp-muted)]">
                                Selecione uma conta para visualizar o preview.
                            </p>
                        )}
                        {selectedNetworks.map((n) => (
                            <div key={n} className="border border-black bg-white p-3 mb-3 last:mb-0">
                                <div className="text-xs font-bold uppercase tracking-wider mb-2">
                                    {NETWORKS.find((x) => x.id === n)?.label}
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {content || (
                                        <span className="text-[var(--mp-muted)]">Seu post aparece aqui…</span>
                                    )}
                                </p>
                                {media[0] && (
                                    <img
                                        src={media[0]}
                                        alt=""
                                        className="mt-2 w-full max-h-40 object-cover border border-black"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
