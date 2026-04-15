"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Stats = {
  voluntarios: number;
  eventosMes: number;
  trocasPendentes: number;
};

type Troca = {
  id: string;
  solicitante: string;
  data_escala: string;
  evento: string;
};

function getMesAno() {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatarData(data: string) {
  const d = new Date(data + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState<Stats>({ voluntarios: 0, eventosMes: 0, trocasPendentes: 0 });
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      const { count: totalVol } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const inicio = new Date();
      inicio.setDate(1);
      const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);

      const { count: totalEventos } = await supabase
        .from("eventos")
        .select("*", { count: "exact", head: true })
        .gte("data", inicio.toISOString().split("T")[0])
        .lte("data", fim.toISOString().split("T")[0]);

      const { count: totalTrocas } = await supabase
        .from("trocas")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      const { data: trocasData } = await supabase
        .from("trocas")
        .select(`
          id,
          status,
          escalas (
            data,
            evento,
            profiles (name)
          )
        `)
        .eq("status", "pendente")
        .order("created_at", { ascending: false })
        .limit(3);

      setStats({
        voluntarios: totalVol ?? 0,
        eventosMes: totalEventos ?? 0,
        trocasPendentes: totalTrocas ?? 0,
      });

      const trocasFormatadas = (trocasData ?? []).map((t: any) => ({
        id: t.id,
        solicitante: t.escalas?.profiles?.name ?? "—",
        data_escala: t.escalas?.data ?? "",
        evento: t.escalas?.evento ?? "—",
      }));

      setTrocas(trocasFormatadas);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function aprovarTroca(id: string) {
    await supabase.from("trocas").update({ status: "aprovado" }).eq("id", id);
    setTrocas((prev) => prev.filter((t) => t.id !== id));
    setStats((prev) => ({ ...prev, trocasPendentes: prev.trocasPendentes - 1 }));
  }

  async function recusarTroca(id: string) {
    await supabase.from("trocas").update({ status: "recusado" }).eq("id", id);
    setTrocas((prev) => prev.filter((t) => t.id !== id));
    setStats((prev) => ({ ...prev, trocasPendentes: prev.trocasPendentes - 1 }));
  }

  const acoes = [
    {
      label: "Gerar escala",
      sub: "Próximo mês",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      bg: "bg-indigo-50 text-indigo-600",
      href: "/dashboard/admin/escalas/gerar",
    },
    {
      label: "Ver escalas",
      sub: "Mês atual",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      bg: "bg-emerald-50 text-emerald-600",
      href: "/dashboard/admin/escalas",
    },
    {
      label: "Equipe",
      sub: "Voluntários",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 20c0-4 2.686-7 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 20c0-3 1.79-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      bg: "bg-amber-50 text-amber-600",
      href: "/dashboard/admin/equipe",
    },
    {
      label: "Eventos",
      sub: "Cadastrar datas",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 14h1M12 14h1M16 14h1M8 17h1M12 17h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      bg: "bg-orange-50 text-orange-600",
      href: "/dashboard/admin/eventos",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Painel admin</p>
          <p className="text-xs text-gray-400">{getMesAno()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
            Admin
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 border border-gray-200 rounded-md px-3 py-1 hover:text-gray-600 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-16">Carregando...</p>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-400 mb-1">Voluntários</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.voluntarios}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-400 mb-1">Eventos mês</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.eventosMes}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-400 mb-1">Trocas pend.</p>
                <p className={`text-2xl font-semibold ${stats.trocasPendentes > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {stats.trocasPendentes}
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Ações rápidas
              </p>
              <div className="grid grid-cols-2 gap-3">
                {acoes.map((a) => (
                  <button
                    key={a.href}
                    onClick={() => router.push(a.href)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${a.bg}`}>
                      {a.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
                  </button>
                ))}

                {/* Enviar WhatsApp — largura total */}
                <button
                  onClick={() => router.push("/dashboard/admin/whatsapp")}
                  className="col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Enviar escalas via WhatsApp</p>
                    <p className="text-xs text-gray-400">Notificar todos os voluntários</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Trocas pendentes */}
            {trocas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Trocas pendentes
                </p>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {trocas.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t.solicitante}</p>
                        <p className="text-xs text-gray-400">
                          {t.evento}{t.data_escala ? ` · ${formatarData(t.data_escala)}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => aprovarTroca(t.id)}
                          className="text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => recusarTroca(t.id)}
                          className="text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}