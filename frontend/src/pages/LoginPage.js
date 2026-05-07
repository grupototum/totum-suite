import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";

const FEATURED_IMG =
    "https://images.unsplash.com/photo-1649783467317-810564b3df8a?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80";

export default function LoginPage({ mode = "login" }) {
    const { user, login, register } = useAuth();
    const [tab, setTab] = useState(mode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    if (user && user !== false) {
        const to = location.state?.from?.pathname || "/dashboard";
        return <Navigate to={to} replace />;
    }

    const submit = async (e) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            if (tab === "login") {
                await login(email, password);
            } else {
                await register(email, password, name || email.split("@")[0]);
            }
            navigate("/dashboard", { replace: true });
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail) || ex.message);
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + "/dashboard";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#fafafa]" data-testid="login-page">
            {/* Left: brand panel */}
            <div className="relative hidden lg:flex flex-col justify-between border-r border-black overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.85]"
                    style={{
                        backgroundImage: `url(${FEATURED_IMG})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="absolute inset-0 bg-[var(--mp-primary)]/10 mp-grid-bg" />
                <div className="relative p-10">
                    <div className="font-display text-3xl tracking-tight">
                        MIX<span className="text-[var(--mp-primary)]">/</span>POST
                    </div>
                    <div className="label-overline mt-2 text-[var(--mp-muted)]">Social Media OS</div>
                </div>
                <div className="relative p-10">
                    <div className="mp-card p-6 max-w-sm bg-white">
                        <div className="label-overline mb-2">manifesto</div>
                        <h2 className="font-display text-2xl leading-tight mb-3">
                            Planeje. Componha. Publique.<br />
                            Sem fricção.
                        </h2>
                        <p className="text-sm text-[var(--mp-muted)]">
                            Um cockpit objetivo para gerenciar todas as suas redes em um só lugar.
                        </p>
                    </div>
                </div>
                <div className="relative p-10 flex gap-3">
                    <span className="mp-pill">Workspaces</span>
                    <span className="mp-pill">Composer IA</span>
                    <span className="mp-pill">Calendário</span>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden font-display text-2xl mb-8">
                        MIX<span className="text-[var(--mp-primary)]">/</span>POST
                    </div>
                    <div className="label-overline mb-2">acesso</div>
                    <h1 className="font-display text-4xl mb-2">
                        {tab === "login" ? "Entrar." : "Criar conta."}
                    </h1>
                    <p className="text-sm text-[var(--mp-muted)] mb-6">
                        {tab === "login"
                            ? "Use seu email ou continue com Google."
                            : "Comece a publicar em minutos. Sem cartão de crédito."}
                    </p>

                    <div className="grid grid-cols-2 gap-0 mb-6 border border-black">
                        <button
                            type="button"
                            data-testid="tab-login-btn"
                            onClick={() => setTab("login")}
                            className={`h-10 text-sm font-bold uppercase tracking-wider ${
                                tab === "login" ? "bg-black text-white" : "bg-white text-black"
                            }`}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            data-testid="tab-register-btn"
                            onClick={() => setTab("register")}
                            className={`h-10 text-sm font-bold uppercase tracking-wider border-l border-black ${
                                tab === "register" ? "bg-black text-white" : "bg-white text-black"
                            }`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
                        {tab === "register" && (
                            <div>
                                <label className="label-overline block mb-2">Nome</label>
                                <input
                                    data-testid="auth-name-input"
                                    type="text"
                                    className="mp-input"
                                    placeholder="Como podemos te chamar?"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label className="label-overline block mb-2">Email</label>
                            <input
                                data-testid="auth-email-input"
                                type="email"
                                className="mp-input"
                                placeholder="voce@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="label-overline block mb-2">Senha</label>
                            <input
                                data-testid="auth-password-input"
                                type="password"
                                className="mp-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {err && (
                            <div
                                className="border border-[var(--mp-error)] text-[var(--mp-error)] p-3 text-sm"
                                data-testid="auth-error"
                            >
                                {err}
                            </div>
                        )}

                        <button
                            type="submit"
                            data-testid="auth-submit-btn"
                            disabled={loading}
                            className="mp-btn w-full"
                        >
                            {loading
                                ? "Carregando…"
                                : tab === "login"
                                  ? "Entrar com email"
                                  : "Criar minha conta"}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-black" />
                        <span className="label-overline">ou</span>
                        <div className="flex-1 h-px bg-black" />
                    </div>

                    <button
                        type="button"
                        data-testid="google-login-btn"
                        onClick={googleLogin}
                        className="mp-btn mp-btn-secondary w-full"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                            />
                        </svg>
                        Continuar com Google
                    </button>

                    <p className="text-xs text-[var(--mp-muted)] mt-6">
                        Ao continuar, você concorda com os termos de uso e a política de privacidade.
                    </p>
                </div>
            </div>
        </div>
    );
}
