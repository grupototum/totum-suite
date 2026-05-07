import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import DashboardPage from "@/pages/DashboardPage";
import ComposerPage from "@/pages/ComposerPage";
import CalendarPage from "@/pages/CalendarPage";
import PostsPage from "@/pages/PostsPage";
import AccountsPage from "@/pages/AccountsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

function AppRouter() {
    const location = useLocation();
    // Synchronous detection of OAuth callback fragment to avoid race conditions
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/login" element={<LoginPage mode="login" />} />
            <Route path="/register" element={<LoginPage mode="register" />} />
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/composer" element={<ComposerPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}
