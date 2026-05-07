import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BASE}/api`;

export const api = axios.create({
    baseURL: API,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error — backend is unreachable
            error.message = "Backend não está acessível. Verifique se a API está rodando e se a variável REACT_APP_BACKEND_URL está configurada corretamente no Vercel.";
        }
        return Promise.reject(error);
    }
);

export function formatApiError(detail) {
    if (detail == null) return "Algo deu errado. Tente novamente.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}
