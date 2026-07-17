"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { NotificationBell } from "../components/layout/NotificationBell";

interface UserData {
  id: string;
  name: string;
  role: string;
  course?: string;
  institution?: string;
  avatarUrl?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserData | null>(null);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0d0f11] text-[#316cf4]">
        <p className="font-medium animate-pulse">Carregando ConnectU...</p>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname.startsWith(path);

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? "bg-[#316cf4]/10 text-[#316cf4]"
        : "text-gray-400 hover:bg-[#181a1d] hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-[#0d0f11] text-white font-sans">
      {/* ===== HEADER GLOBAL FIXO ===== */}
      <header
        className="fixed top-0 left-0 right-0 h-16 bg-[#0d0f11] border-b border-[#2a2d32] z-50 flex items-center px-4 md:px-6 justify-between"
        data-purpose="global-header"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-[#0d0f11] font-extrabold">C</span>
            </div>
            <span className="hidden sm:inline">ConnectU</span>
          </div>
        </div>

        {/* Search Bar */}
        <form
          className="hidden md:flex flex-1 max-w-2xl px-8"
          data-purpose="search-container"
          onSubmit={(e) => {
            e.preventDefault();
            const val = new FormData(e.currentTarget).get("q") as string;
            router.push(`/dashboard/explorar?q=${encodeURIComponent(val || "")}`);
          }}
        >
          <div className="relative w-full">
            <input
              name="q"
              className="block w-full bg-[#1c1e22] border-none text-sm text-white rounded-lg focus:ring-[#316cf4] focus:outline-none pl-4 pr-10 h-10"
              placeholder="Pesquisar pessoas, empresas, vagas..."
              type="text"
              onChange={(e) => {
                const val = e.target.value;
                router.replace(`/dashboard/explorar?q=${encodeURIComponent(val)}`);
              }}
            />
            <button 
              type="submit" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <NotificationBell placement="bottom" />

          <Link
            href="/dashboard/perfil"
            className="flex items-center gap-2 cursor-pointer"
          >
            {user.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-transparent hover:border-[#316cf4] transition-colors"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center border-2 border-transparent hover:border-[#316cf4] transition-colors">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ===== CONTEÚDO ABAIXO DO HEADER ===== */}
      <div className="pt-16 flex min-h-screen">
        {/* ===== SIDEBAR ESQUERDA (Desktop) ===== */}
        <aside
          className="w-64 fixed left-0 top-16 bottom-0 overflow-y-auto hidden lg:block border-r border-[#2a2d32] p-4 space-y-8"
          data-purpose="navigation-sidebar"
        >
          {/* Seção: Principal */}
          <nav>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Principal
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className={linkClass(isActive("/dashboard"))}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/explorar"
                  className={linkClass(isActivePrefix("/dashboard/explorar"))}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Explorar
                </Link>
              </li>
              <li>
                {user.role === "STUDENT" ? (
                  <Link
                    href="/dashboard/vagas"
                    className={linkClass(
                      isActive("/dashboard/vagas"),
                    )}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    Vagas &amp; Match
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/minhas-vagas"
                    className={linkClass(
                      isActive("/dashboard/minhas-vagas"),
                    )}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    Minhas Vagas
                  </Link>
                )}
              </li>
              <li>
                <Link
                  href="/dashboard/chat"
                  className={linkClass(isActivePrefix("/dashboard/chat"))}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Mensagens
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/perfil"
                  className={linkClass(isActive("/dashboard/perfil"))}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Meu Perfil
                </Link>
              </li>
            </ul>
          </nav>

          {/* Seção: Comunidade */}
          <nav>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-t border-[#2a2d32] pt-6">
              Comunidade
            </p>
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-white rounded-lg transition-all text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Mentoria
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-white rounded-lg transition-all text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Eventos
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-white rounded-lg transition-all text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Grupos
                </a>
              </li>
            </ul>
          </nav>

          {/* Seção: Suporte */}
          <nav>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-t border-[#2a2d32] pt-6">
              Suporte
            </p>
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-white rounded-lg transition-all text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-white rounded-lg transition-all text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Termos de Uso
                </a>
              </li>
            </ul>
          </nav>

          {/* Rodapé da Sidebar com botão de logout */}
          <div className="border-t border-[#2a2d32] pt-6">
            <button
              onClick={() => {
                localStorage.removeItem("connectu_user");
                localStorage.removeItem("connectu_token");
                router.push("/");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-red-400 rounded-lg transition-all text-sm font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </div>
        </aside>

        {/* ===== MENU MOBILE (overlay) ===== */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-[#0d0f11]/95 backdrop-blur-sm overflow-y-auto">
            <div className="flex flex-col p-4 space-y-6">
              <nav>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Principal
                </p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClass(isActive("/dashboard"))}
                    >
                      Início
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/explorar"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClass(
                        isActivePrefix("/dashboard/explorar"),
                      )}
                    >
                      Explorar
                    </Link>
                  </li>
                  <li>
                    {user.role === "STUDENT" ? (
                      <Link
                        href="/dashboard/vagas"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={linkClass(isActive("/dashboard/vagas"))}
                      >
                        Vagas &amp; Match
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/minhas-vagas"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={linkClass(
                          isActive("/dashboard/minhas-vagas"),
                        )}
                      >
                        Minhas Vagas
                      </Link>
                    )}
                  </li>
                  <li>
                    <Link
                      href="/dashboard/chat"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClass(isActivePrefix("/dashboard/chat"))}
                    >
                      Mensagens
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/perfil"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClass(isActive("/dashboard/perfil"))}
                    >
                      Meu Perfil
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="border-t border-[#2a2d32] pt-4">
                <button
                  onClick={() => {
                    localStorage.removeItem("connectu_user");
                    localStorage.removeItem("connectu_token");
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#181a1d] hover:text-red-400 rounded-lg transition-all text-sm font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ÁREA PRINCIPAL DE CONTEÚDO ===== */}
        <main className="flex-1 lg:ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
