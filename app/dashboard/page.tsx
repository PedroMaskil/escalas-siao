"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Escala = {
  id: string;
  data: string;
  evento: string;
  horario: string;
  funcao: string;
  area: string;
};

type Profile = {
  name: string;
  area: string;
};

const AREA_COLOR: Record<string, string> = {
  som: "bg-indigo-100 text-indigo-800",
  transmissao: "bg-emerald-100 text-emerald-800",
  luz: "bg-amber-100 text-amber-800",
  projecao: "bg-orange-100 text-orange-800",
};

const AREA_DOT: Record<string, string> = {
  som: "bg-indigo-500",
  transmissao: "bg-emerald-500",
  luz: "bg-amber-500",
  projecao: "bg-orange-500",
};

const AREA_LABEL: Record<string, string> = {
  som: "Som",
  transmissao: "Transmissão",
  luz: "Luz",
  projecao: "Projeção",
};

function diasRestantes(data: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(data + "T00:00:00");
  const diff = Math.round((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return `${diff} dias`;
}

function formatarData(data: string) {
  const d = new Date(data + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getMesAno() {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function DashboardUsuario() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("name, area")
        .eq("id", user.id)
        .single();

      setProfile(prof);

      const hoje = new Date().toISOString().split("T")[0];
      const { data: esc } = await supabase
        .from("escalas")
        .select("id, data, evento, horario, funcao, area")
        .eq("voluntario_id", user.id)
        .gte("data", hoje)
        .order("data", { ascending: true })
        .limit(10);

      setEscalas(esc ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const proximaEscala = escalas[0] ?? null;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Olá, {profile?.name?.split(" ")[0] ?? "..."}
          </p>
          <p className="text-xs text-gray-400">
            {profile?.area ? AREA_LABEL[profile.area] : "—"} · {getMesAno()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">
            {profile?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
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
            {/* Card próxima escala */}
            {proximaEscala && (
              <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-indigo-500 p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Próxima escala
                </p>
                <p className="text-base font-semibold text-gray-900 mb-1">
                  {proximaEscala.evento}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {formatarData(proximaEscala.data)} · {proximaEscala.horario} · {proximaEscala.funcao}
                </p>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${AREA_COLOR[proximaEscala.area] ?? "bg-gray-100 text-gray-600"}`}>
                  {diasRestantes(proximaEscala.data)}
                </span>
              </div>
            )}

            {/* Lista escalas */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Escalas do mês
              </p>

              {escalas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  Nenhuma escala encontrada.
                </p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {escalas.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${AREA_DOT[e.area] ?? "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{e.evento}</p>
                        <p className="text-xs text-gray-400">{formatarData(e.data)} · {e.horario} · {e.funcao}</p>
                      </div>
                      <span className="text-xs font-medium text-indigo-500 whitespace-nowrap">
                        {diasRestantes(e.data) ?? (
                          <span className="text-gray-300">Realizado</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/dashboard/indisponibilidades")}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 15l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Marcar indisponível
              </button>
              <button
                onClick={() => router.push("/dashboard/trocas")}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M7 16l-4-4 4-4M17 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Pedir troca
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}