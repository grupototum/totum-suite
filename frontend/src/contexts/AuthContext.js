import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null=loading, false=guest, object=auth
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);

    const refreshWorkspaces = useCallback(async () => {
        try {
            const { data } = await api.get("/workspaces");
            setWorkspaces(data);
            return data;
        } catch {
            return [];
        }
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
            const ws = await refreshWorkspaces();
            const active = ws.find((w) => w.workspace_id === data.active_workspace_id) || ws[0] || null;
            setActiveWorkspace(active);
        } catch {
            setUser(false);
            setWorkspaces([]);
            setActiveWorkspace(null);
        }
    }, [refreshWorkspaces]);

    useEffect(() => {
        // Skip auto-check if returning from Google OAuth (AuthCallback handles it)
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            return;
        }
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setUser(data);
        const ws = await refreshWorkspaces();
        const active = ws.find((w) => w.workspace_id === data.active_workspace_id) || ws[0] || null;
        setActiveWorkspace(active);
        return data;
    };

    const register = async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        setUser(data);
        const ws = await refreshWorkspaces();
        const active = ws.find((w) => w.workspace_id === data.active_workspace_id) || ws[0] || null;
        setActiveWorkspace(active);
        return data;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            // Logout failures (e.g., expired session) are non-blocking,
            // but we still log to aid debugging.
            console.warn("Logout request failed; clearing client state anyway.", err);
        }
        setUser(false);
        setWorkspaces([]);
        setActiveWorkspace(null);
    };

    const switchWorkspace = async (workspace_id) => {
        const { data } = await api.post(`/workspaces/${workspace_id}/activate`);
        setUser(data);
        const ws = workspaces.find((w) => w.workspace_id === workspace_id);
        setActiveWorkspace(ws || null);
    };

    return (
        <AuthCtx.Provider
            value={{
                user,
                setUser,
                workspaces,
                activeWorkspace,
                refreshWorkspaces,
                setActiveWorkspace,
                login,
                register,
                logout,
                switchWorkspace,
                checkAuth,
            }}
        >
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
