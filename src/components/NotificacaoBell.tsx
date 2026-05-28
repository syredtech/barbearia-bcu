"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Notificacao {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

export default function NotificacaoBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/owner/notificacoes");
    if (!res.ok) return;
    const data = await res.json();
    setNotificacoes(data.notificacoes);
    setUnread(data.unread);
  }, []);

  useEffect(() => {
    load();
    let es: EventSource;
    function connect() {
      es = new EventSource("/api/owner/events");
      es.onmessage = () => load();
      // Auto-reconnect when the 25 s window closes
      es.onerror = () => { es.close(); setTimeout(connect, 1000); };
    }
    connect();
    return () => es?.close();
  }, [load]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      await fetch("/api/owner/notificacoes", { method: "PATCH" });
      setUnread(0);
      setNotificacoes((ns) => ns.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors duration-200"
        aria-label="Notificações"
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-ink text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-[#ebebeb] rounded-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ebebeb] flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Notificações</p>
            {notificacoes.length > 0 && (
              <span className="text-xs text-muted">{notificacoes.length}</span>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted font-light">Sem notificações.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[#f5f5f5]">
              {notificacoes.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${!n.read ? "bg-[#fafafa]" : ""}`}>
                  <div className="flex items-start gap-2.5">
                    {!n.read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ink shrink-0" />
                    )}
                    {n.read && <span className="mt-1.5 w-1.5 h-1.5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink">{n.title}</p>
                      <p className="text-xs text-muted font-light mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-muted shrink-0 mt-0.5" suppressHydrationWarning>
                      {mounted ? timeAgo(n.createdAt) : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
