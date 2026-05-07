import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function fmtMonth(d) {
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function CalendarPage() {
    const { activeWorkspace } = useAuth();
    const [cursor, setCursor] = useState(new Date());
    const [posts, setPosts] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);

    const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
    const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

    // grid: start at Monday before monthStart
    const gridStart = useMemo(() => {
        const dow = (monthStart.getDay() + 6) % 7; // Mon=0
        return addDays(monthStart, -dow);
    }, [monthStart]);
    const gridEnd = useMemo(() => addDays(gridStart, 41), [gridStart]);

    useEffect(() => {
        if (!activeWorkspace) return;
        api.get("/calendar", {
            params: {
                workspace_id: activeWorkspace.workspace_id,
                start: gridStart.toISOString(),
                end: gridEnd.toISOString(),
            },
        }).then((r) => setPosts(r.data));
    }, [activeWorkspace, gridStart, gridEnd]);

    const byDay = useMemo(() => {
        const map = {};
        posts.forEach((p) => {
            const dt = p.scheduled_at || p.published_at;
            if (!dt) return;
            const k = new Date(dt).toISOString().slice(0, 10);
            map[k] ||= [];
            map[k].push(p);
        });
        return map;
    }, [posts]);

    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

    return (
        <div className="p-8 space-y-6" data-testid="calendar-page">
            <header className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <div className="label-overline mb-2">visão</div>
                    <h1 className="font-display text-5xl tracking-tighter capitalize">
                        {fmtMonth(cursor)}.
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="mp-btn mp-btn-secondary h-10 w-10 p-0"
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                        data-testid="cal-prev-btn"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className="mp-btn mp-btn-secondary h-10 px-3 text-xs"
                        onClick={() => setCursor(new Date())}
                        data-testid="cal-today-btn"
                    >
                        Hoje
                    </button>
                    <button
                        className="mp-btn mp-btn-secondary h-10 w-10 p-0"
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                        data-testid="cal-next-btn"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            <div className="mp-card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-black">
                    {WEEKDAYS.map((w) => (
                        <div key={w} className="p-3 label-overline border-r border-black last:border-0">
                            {w}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((d, i) => {
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const k = d.toISOString().slice(0, 10);
                        const today = new Date().toDateString() === d.toDateString();
                        const items = byDay[k] || [];
                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDay(k)}
                                data-testid={`day-${k}`}
                                className={`min-h-[120px] border-r border-b border-black/20 last:border-r-0 p-2 cursor-pointer ${
                                    inMonth ? "bg-white" : "bg-[#f4f4f4]"
                                } ${today ? "outline outline-2 outline-[var(--mp-primary)] outline-offset-[-2px]" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold ${inMonth ? "" : "text-[var(--mp-muted)]"}`}>
                                        {d.getDate()}
                                    </span>
                                    {items.length > 0 && (
                                        <span className="mp-pill bg-[var(--mp-primary)] text-white border-[var(--mp-primary)] !px-2 !py-0 text-[10px]">
                                            {items.length}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 space-y-1">
                                    {items.slice(0, 2).map((p) => (
                                        <div
                                            key={p.post_id}
                                            className={`text-xs truncate border border-black px-1 py-0.5 ${
                                                p.status === "published"
                                                    ? "bg-[var(--mp-success)] text-white"
                                                    : p.status === "scheduled"
                                                      ? "bg-[var(--mp-secondary)]"
                                                      : "bg-white"
                                            }`}
                                            title={p.content}
                                        >
                                            {new Date(p.scheduled_at || p.published_at).toLocaleTimeString("pt-BR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            {" · "}
                                            {p.content.slice(0, 28)}
                                        </div>
                                    ))}
                                    {items.length > 2 && (
                                        <div className="text-[10px] text-[var(--mp-muted)] font-bold">
                                            +{items.length - 2} outros
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDay && byDay[selectedDay]?.length > 0 && (
                <div className="mp-card p-5" data-testid="day-details">
                    <div className="label-overline mb-2">{selectedDay}</div>
                    <ul className="space-y-2">
                        {byDay[selectedDay].map((p) => (
                            <li key={p.post_id} className="border border-black p-3">
                                <div className="text-xs font-mono mb-1">
                                    {new Date(p.scheduled_at || p.published_at).toLocaleString("pt-BR")} · {p.status}
                                </div>
                                <p className="text-sm">{p.content}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
