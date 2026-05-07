import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
    const navigate = useNavigate();
    const processed = useRef(false);
    const [error, setError] = useState(null);
    const { setUser, refreshWorkspaces, setActiveWorkspace } = useAuth();

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || "";
        const match = hash.match(/session_id=([^&]+)/);
        if (!match) {
            navigate("/login", { replace: true });
            return;
        }
        const session_id = decodeURIComponent(match[1]);
        (async () => {
            try {
                const { data } = await api.post("/auth/session", { session_id });
                setUser(data);
                const ws = await refreshWorkspaces();
                const active = ws.find((w) => w.workspace_id === data.active_workspace_id) || ws[0] || null;
                setActiveWorkspace(active);
                window.history.replaceState({}, "", "/dashboard");
                navigate("/dashboard", { replace: true });
            } catch (e) {
                setError("Falha ao validar sessão Google. Tente novamente.");
                setTimeout(() => navigate("/login", { replace: true }), 1500);
            }
        })();
    }, [navigate, setUser, refreshWorkspaces, setActiveWorkspace]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--mp-bg)]">
            <div className="mp-card p-10 w-[420px] text-center">
                <div className="label-overline mb-3">autenticando</div>
                <h1 className="font-display text-3xl mb-2">Conectando com Google…</h1>
                {error ? (
                    <p className="text-[var(--mp-error)] text-sm mt-4" data-testid="auth-callback-error">
                        {error}
                    </p>
                ) : (
                    <p className="text-[var(--mp-muted)] text-sm">Por favor aguarde.</p>
                )}
            </div>
        </div>
    );
}
