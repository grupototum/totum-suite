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
    const [user, setUser] = useState(MOCK_USER); // sempre logado (modo demo)
    const [workspaces, setWorkspaces] = useState(MOCK_WORKSPACES);
    const [activeWorkspace, setActiveWorkspace] = useState(MOCK_WORKSPACES[0]);

    const refreshWorkspaces = useCallback(async () => {
        return MOCK_WORKSPACES;
    }, []);

    const checkAuth = useCallback(async () => {
        // Demo mode: sempre mantém usuário mock
        setUser(MOCK_USER);
        setWorkspaces(MOCK_WORKSPACES);
        setActiveWorkspace(MOCK_WORKSPACES[0]);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async () => {
        setUser(MOCK_USER);
        setWorkspaces(MOCK_WORKSPACES);
        setActiveWorkspace(MOCK_WORKSPACES[0]);
        return MOCK_USER;
    };

    const register = async () => {
        setUser(MOCK_USER);
        setWorkspaces(MOCK_WORKSPACES);
        setActiveWorkspace(MOCK_WORKSPACES[0]);
        return MOCK_USER;
    };

    const logout = async () => {
        // Em demo mode, não desloga de verdade — apenas recarrega
        window.location.reload();
    };

    const switchWorkspace = async (workspace_id) => {
        const ws = workspaces.find((w) => w.workspace_id === workspace_id) || workspaces[0] || null;
        setActiveWorkspace(ws);
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
