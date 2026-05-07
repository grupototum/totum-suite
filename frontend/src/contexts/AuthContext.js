import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

const MOCK_USER = {
    user_id: "mock-user-001",
    email: "admin@mixpost.app",
    name: "Administrador",
    role: "admin",
    active_workspace_id: "mock-ws-001",
};

const MOCK_WORKSPACES = [
    {
        workspace_id: "mock-ws-001",
        name: "Meu Workspace",
        description: "Workspace de demonstração",
        created_at: new Date().toISOString(),
    },
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = loading
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [isDemo, setIsDemo] = useState(false);

    const fallbackToDemo = useCallback(() => {
        setUser(MOCK_USER);
        setWorkspaces(MOCK_WORKSPACES);
        setActiveWorkspace(MOCK_WORKSPACES[0]);
        setIsDemo(true);
    }, []);

    const refreshWorkspaces = useCallback(async () => {
        if (isDemo) return MOCK_WORKSPACES;
        try {
            const { data } = await api.get("/workspaces");
            setWorkspaces(data);
            return data;
        } catch {
            return [];
        }
    }, [isDemo]);

    const checkAuth = useCallback(async () => {
        // Skip auto-check if returning from Google OAuth
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
            const ws = await api.get("/workspaces");
            setWorkspaces(ws.data);
            const active = ws.data.find((w) => w.workspace_id === data.active_workspace_id) || ws.data[0] || null;
            setActiveWorkspace(active);
            setIsDemo(false);
        } catch {
            fallbackToDemo();
        }
    }, [fallbackToDemo]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            setUser(data);
            const ws = await api.get("/workspaces");
            setWorkspaces(ws.data);
            const active = ws.data.find((w) => w.workspace_id === data.active_workspace_id) || ws.data[0] || null;
            setActiveWorkspace(active);
            setIsDemo(false);
            return data;
        } catch {
            fallbackToDemo();
            return MOCK_USER;
        }
    };

    const register = async (email, password, name) => {
        try {
            const { data } = await api.post("/auth/register", { email, password, name });
            setUser(data);
            const ws = await api.get("/workspaces");
            setWorkspaces(ws.data);
            const active = ws.data.find((w) => w.workspace_id === data.active_workspace_id) || ws.data[0] || null;
            setActiveWorkspace(active);
            setIsDemo(false);
            return data;
        } catch {
            fallbackToDemo();
            return MOCK_USER;
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Ignora erro de logout
        }
        setUser(false);
        setWorkspaces([]);
        setActiveWorkspace(null);
        setIsDemo(false);
    };

    const switchWorkspace = async (workspace_id) => {
        if (isDemo) {
            const ws = workspaces.find((w) => w.workspace_id === workspace_id) || workspaces[0] || null;
            setActiveWorkspace(ws);
            return;
        }
        try {
            const { data } = await api.post(`/workspaces/${workspace_id}/activate`);
            setUser(data);
            const ws = workspaces.find((w) => w.workspace_id === workspace_id);
            setActiveWorkspace(ws || null);
        } catch {
            // Mantém workspace atual em caso de erro
        }
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
                isDemo,
            }}
        >
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
