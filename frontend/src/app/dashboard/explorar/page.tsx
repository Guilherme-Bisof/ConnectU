"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiSearch,
  FiAward,
  FiBookOpen,
  FiBriefcase,
} from "react-icons/fi";
import { useRef } from "react";

interface SearchedUser {
  id: string;
  name: string;
  role: string;
  companyId?: string | null;
  avatarUrl?: string | null;
  course?: string | null;
  institution?: string | null;
  skills: string[];
  isPioneer?: boolean;
}

function ExplorarContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  async function handleSearch(searchTerm: string) {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal
        },
      );

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        console.error("Erro na busca");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Erro de conexão ao buscar:", error);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(localQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [localQuery]);

  return (
    <div className="mx-auto max-w-4xl animate-fadeIn">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 md:mb-0">Explorar Rede</h2>
        <p className="text-zinc-400 hidden md:block">
          Busque por talentos, recrutadores, cursos ou palavras-chave de competências.
        </p>
      </div>

      {/* Mobile Search Input */}
      <div className="mb-6 md:hidden">
        <label className="sr-only" htmlFor="mobile-explore-search">
          Pesquisar na rede
        </label>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            id="mobile-explore-search"
            type="search"
            placeholder="Pesquisar pessoas, cursos ou competências..."
            className="h-[48px] w-full min-w-0 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-10 focus:outline-none focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4]"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {localQuery.length > 0 && (
            <button
              onClick={() => setLocalQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              aria-label="Limpar pesquisa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Resultados ou Estados */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-[#316cf4] mb-3" />
          Varrendo a rede...
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900 shadow-sm w-full min-w-0 max-w-full overflow-hidden"
            >
              <div>
                {/* Topo do Card: Avatar + Nome */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg font-bold text-[#316cf4] overflow-hidden shadow-inner">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile.name.charAt(0)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-100 truncate group-hover:text-[#316cf4] transition-colors">
                        {profile.name}
                      </h3>
                      {profile.isPioneer && (
                        <div
                          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 to-amber-900/40 px-2 py-0.5"
                          title="Membro Fundador"
                        >
                          <FiAward className="text-amber-400" size={10} />
                          <span className="text-[9px] font-black uppercase text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                            Pioneiro
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 truncate">
                      {profile.role === "STUDENT" ? (
                        <>
                          <FiBookOpen size={12} className="text-purple-400" />
                          <span className="truncate">{profile.course}</span>
                        </>
                      ) : (
                        <>
                          <FiBriefcase size={12} className="text-emerald-400" />
                          <span>Recrutador Corporativo</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Subtítulo */}
                {profile.role === "STUDENT" && profile.institution && (
                  <p className="text-xs text-zinc-500 px-1 mb-3 truncate">
                    {profile.institution}
                  </p>
                )}

                {/* Tags */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.skills.slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="rounded bg-zinc-800/60 px-2 py-0.5 text-[11px] font-medium text-zinc-400 border border-zinc-800 truncate max-w-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 4 && (
                      <span className="text-[10px] text-zinc-600 font-bold self-center ml-1">
                        +{profile.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botão de Ação */}
              <div className="mt-2 border-t border-zinc-800/50 pt-3 flex items-center justify-between">
                <Link
                  href={`/dashboard/perfil/${profile.id}`}
                  className="text-xs font-semibold text-[#316cf4] hover:text-blue-400 transition-colors"
                >
                  Ver perfil completo →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <p className="text-sm">
            Nenhum perfil ou competência corresponde à sua busca.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Tente pesquisar termos como &quot;React&quot;, &quot;Node&quot;, &quot;Design&quot; ou outros
            nomes.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-12 text-center text-zinc-500">
          <FiSearch className="mx-auto text-3xl text-zinc-700 mb-3" />
          <p className="text-sm">
            Pesquise por pessoas, cursos ou competências.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16 text-zinc-500">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-[#316cf4]" />
      </div>
    }>
      <ExplorarContent />
    </Suspense>
  );
}
