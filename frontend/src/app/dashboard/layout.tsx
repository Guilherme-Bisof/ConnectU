"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  role: string;
  course?: string;
  institution?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserData | null>(null);
  // Estado Menu Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("connectu_user");

      if (!storedUser) {
        router.push("/");
      } else {
        setUser(JSON.parse(storedUser));
      }
    };

    checkAuth();
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-blue-500">
        <p className="font-medium animate-pulse">Carregando ConnectU...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* SIDEBAR (Menu Lateral) */}
      <aside className="w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-6 hidden md:flex">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white italic">
            ConnectU
          </h1>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          <Link
            href="/dashboard"
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Feed Principal
          </Link>

          {/* Renderização Condicional: Aluno vê Vagas, Recrutador vê Minhas Vagas */}
          {user.role === "STUDENT" ? (
            <Link
              href="/dashboard/vagas"
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard/vagas"
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              Vagas & Match
            </Link>
          ) : (
            <Link
              href="/dashboard/minhas-vagas"
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard/minhas-vagas"
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              Minhas Vagas
            </Link>
          )}

          <Link
            href="/dashboard/perfil"
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              pathname === "/dashboard/perfil"
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Meu Perfil
          </Link>

          {/* ABA MENSAGENS ADICIONADA AQUI NO DESKTOP */}
          <Link
            href="/dashboard/chat"
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/dashboard/chat")
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Mensagens
          </Link>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="mt-auto border-t border-zinc-800 pt-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-500">
              {user.role === "STUDENT" ? user.course : "Empresa"}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("connectu_user");
              router.push("/");
            }}
            className="w-full rounded-md border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-red-400"
          >
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL*/}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Header Mobile */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-4 md:hidden">
          <h1 className="text-xl font-bold text-white italic">ConnectU</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800"
          >
            {isMobileMenuOpen ? "Fechar" : "Menu"}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col border-b border-zinc-800 bg-zinc-950 px-4 py-4 absolute w-full z-50 shadow-2xl">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-md px-4 py-3 text-sm font-medium ${pathname === "/dashboard" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
              >
                Feed Principal
              </Link>

              {user.role === "STUDENT" ? (
                <Link
                  href="/dashboard/vagas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-md px-4 py-3 text-sm font-medium ${pathname === "/dashboard/vagas" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                >
                  {" "}
                  Vagas & Match
                </Link>
              ) : (
                <Link
                  href="/dashboard/minhas-vagas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-md px-4 py-3 text-sm font-medium ${pathname === "/dashboard/minhas-vagas" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                >
                  Minhas Vagas
                </Link>
              )}

              <Link
                href="/dashboard/perfil"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-md px-4 py-3 text-sm font-medium ${pathname === "/dashboard/perfil" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
              >
                Meu Perfil
              </Link>

              <Link
                href="/dashboard/chat"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard/chat")
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                Mensagens
              </Link>
            </nav>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <button
                onClick={() => {
                  localStorage.removeItem("connectu_user");
                  router.push("/");
                }}
                className="w-full rounded-md border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-red-400"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        )}

        {/* (Dashboard, Perfil, Vagas, etc) */}
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
