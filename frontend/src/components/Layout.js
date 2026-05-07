import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    PenSquare,
    Calendar,
    ListChecks,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Plus,
    Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { api, formatApiError } from "@/lib/api";

const NAV = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
    { to: "/composer", icon: PenSquare, label: "Compositor" },
    { to: "/calendar", icon: Calendar, label: "Calendário" },
    { to: "/posts", icon: ListChecks, label: "Posts" },
    { to: "/accounts", icon: Users, label: "Contas" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/settings", icon: Settings, label: "Ajustes" },
];

function WorkspaceSwitcher() {
    const { workspaces, activeWorkspace, switchWorkspace, refreshWorkspaces, setActiveWorkspace } = useAuth();
    const [open, setOpen] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [name, setName] = useState("");
    const [err, setErr] = useState(null);

    const create = async (e) => {
        e.preventDefault();
        setErr(null);
        try {
            const { data } = await api.post("/workspaces", { name });
            await refreshWorkspaces();
            setActiveWorkspace(data);
            await switchWorkspace(data.workspace_id);
            setShowNew(false);
            setName("");
            setOpen(false);
        } catch (ex) {
            setErr(formatApiError(ex.response?.data?.detail));
        }
    };

    return (
        <div className="relative">
            <button
                data-testid="workspace-switcher-btn"
                className="w-full flex items-center justify-between gap-2 px-3 h-11 border border-black bg-white hover:bg-[var(--mp-secondary)] transition"
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center gap-2 truncate">
                    <span
                        className="w-3 h-3 border border-black"
                        style={{ background: activeWorkspace?.color || "#002FA7" }}
                    />
                    <span className="font-bold truncate">{activeWorkspace?.name || "Sem workspace"}</span>
                </span>
                <Briefcase size={16} />
            </button>
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-black mp-shadow-soft">
                    <div className="max-h-64 overflow-auto">
                        {workspaces.map((w) => (
                            <button
                                key={w.workspace_id}
                                data-testid={`workspace-item-${w.workspace_id}`}
                                onClick={async () => {
                                    await switchWorkspace(w.workspace_id);
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 border-b border-black/10 hover:bg-[var(--mp-secondary)] ${
                                    activeWorkspace?.workspace_id === w.workspace_id ? "bg-black text-white" : ""
                                }`}
                            >
                                <span
                                    className="w-2.5 h-2.5 border border-black"
                                    style={{ background: w.color }}
                                />
                                {w.name}
                            </button>
                        ))}
                    </div>
                    {showNew ? (
                        <form onSubmit={create} className="p-3 border-t border-black">
                            <input
                                data-testid="new-workspace-name"
                                className="mp-input"
                                placeholder="Nome do workspace"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                            {err && <div className="text-[var(--mp-error)] text-xs mt-2">{err}</div>}
                            <div className="flex gap-2 mt-2">
                                <button type="submit" data-testid="create-workspace-btn" className="mp-btn h-9 px-3 text-xs flex-1">
                                    Criar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNew(false)}
                                    className="mp-btn mp-btn-ghost h-9 px-3 text-xs"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            data-testid="add-workspace-btn"
                            onClick={() => setShowNew(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm border-t border-black bg-white hover:bg-[var(--mp-secondary)]"
                        >
                            <Plus size={14} /> Novo workspace
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex bg-[#fafafa]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-black bg-white flex flex-col" data-testid="sidebar">
                <div className="p-5 border-b border-black">
                    <Link to="/dashboard" className="font-display text-2xl tracking-tight">
                        MIX<span className="text-[var(--mp-primary)]">/</span>POST
                    </Link>
                    <div className="label-overline mt-1 text-[var(--mp-muted)]">Social OS</div>
                </div>
                <div className="p-3 border-b border-black">
                    <WorkspaceSwitcher />
                </div>
                <nav className="flex-1 p-3 space-y-1 overflow-auto">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            data-testid={`nav-${item.to.replace("/", "")}`}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 h-10 text-sm border border-transparent ${
                                    isActive
                                        ? "bg-black text-white border-black"
                                        : "text-[var(--mp-text)] hover:bg-[var(--mp-secondary)] hover:border-black"
                                }`
                            }
                        >
                            <item.icon size={16} />
                            <span className="font-bold">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 border-t border-black flex items-center gap-3">
                    <div className="w-9 h-9 border border-black bg-[var(--mp-secondary)] flex items-center justify-center text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{user?.name}</div>
                        <div className="text-xs text-[var(--mp-muted)] truncate">{user?.email}</div>
                    </div>
                    <button
                        data-testid="logout-btn"
                        onClick={async () => {
                            await logout();
                            navigate("/login");
                        }}
                        className="mp-btn mp-btn-ghost h-9 w-9 p-0"
                        title="Sair"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
