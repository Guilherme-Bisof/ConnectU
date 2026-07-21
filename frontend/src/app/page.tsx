"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiLayers
} from "react-icons/fi";
import { API_URL } from "@/lib/api";

function subscribeToAuth(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getTokenSnapshot() {
  return localStorage.getItem("connectu_token");
}

function getServerTokenSnapshot() {
  return null;
}

export default function AuthPage() {
  const router = useRouter();

  // Estados para fluxo de Login / Cadastro
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("STUDENT");

  // Estados dos inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [institution, setInstitution] = useState("");

  // Estados de controle e UX
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useSyncExternalStore(
    subscribeToAuth,
    getTokenSnapshot,
    getServerTokenSnapshot,
  );

  const hasStoredToken = Boolean(token);

  useEffect(() => {
    if (hasStoredToken) {
      router.replace("/dashboard");
    }
  }, [hasStoredToken, router]);

  if (hasStoredToken) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#121317]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#62f9ee] border-t-transparent" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações básicas antes do fetch
    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }

    if (!isLogin && !name) {
      setError("Preencha o nome.");
      return;
    }

    if (!isLogin && role === "STUDENT" && (!course || !institution)) {
      setError("Preencha o curso e a instituição.");
      return;
    }

    setIsLoading(true);

    const endpoint = isLogin ? "/login" : "/users";
    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: isLogin ? undefined : name,
          role: isLogin ? undefined : role,
          course: isLogin ? undefined : course,
          institution: isLogin ? undefined : institution,
          skills: [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("connectu_user", JSON.stringify(data.user));
          localStorage.setItem("connectu_token", data.token);
          router.replace("/dashboard");
        } else {
          alert("Conta criada com sucesso! Agora faça o login.");
          setIsLogin(true);
          // Limpa campos adicionais
          setName("");
          setCourse("");
          setInstitution("");
        }
      } else {
        setError(data.error || "E-mail ou senha inválidos.");
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }



  const heroPosition = isLogin
    ? "md:translate-x-0"
    : "md:translate-x-full";

  const formPosition = isLogin
    ? "md:translate-x-0"
    : "md:-translate-x-full";

  const innerContentPosition = isLogin
    ? "md:translate-x-0"
    : "md:translate-x-[calc(50vw-96px-100%)]";

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#121317]">
      {/* Left Panel (Hero) */}
      <section
        className={`
          absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden
          bg-[#0d0e12] p-[48px] md:flex flex-col justify-between
          transition-transform duration-[700ms]
          ease-[cubic-bezier(0.22,1,0.36,1)]
          will-change-transform z-20
          ${heroPosition}
        `}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#001020] z-10 mix-blend-multiply opacity-80"></div>
          <div className="absolute inset-0 bg-linear-to-t from-[#0d0e12] via-transparent to-transparent z-10 opacity-100 h-[60%] top-auto"></div>
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login-building.webp')" }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col h-full justify-between">
          {/* Brand Anchor */}
          <div
            className={`flex w-fit items-center gap-3 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${innerContentPosition}`}
          >
            <img src="/logo.png" alt="ConnectU Logo" className="w-25 h-25 object-contain" />
            <span className="font-sans text-2xl tracking-tight text-white font-bold">ConnectU</span>
          </div>
          <div className="mb-8 w-full max-w-[36rem]">
            <h1 className="font-sans text-[48px] leading-[1.1] font-bold text-white mb-6">
              Onde seu talento<br />encontra a<br />oportunidade certa.
            </h1>
            <p className="max-w-[34rem] font-sans text-lg text-[#bacac7] leading-relaxed">
              Junte-se à plataforma que conecta talentos de diversos cursos com empresas de forma inteligente através de compatibilidade de perfil.
            </p>
          </div>
        </div>
      </section>

      {/* Right Panel (Form) */}
      <section
        className={`
          relative flex min-h-dvh w-full items-center justify-center
          overflow-y-auto bg-[#121317] px-[20px] py-[32px]
          md:absolute md:inset-y-0 md:right-0 md:w-1/2
          md:px-[48px] md:py-[40px]
          transition-transform duration-[700ms]
          ease-[cubic-bezier(0.22,1,0.36,1)]
          will-change-transform z-10
          ${formPosition}
        `}
      >
        {/* Mobile Brand (Visible only on small screens) */}
        <div className="md:hidden flex items-center gap-3 w-full max-w-[420px] mb-6 justify-center shrink-0">
          <img src="/logo.png" alt="ConnectU Logo" className="w-8 h-8 object-contain" />
          <span className="font-sans text-2xl text-white font-bold">ConnectU</span>
        </div>

        <div className="w-full max-w-[420px]">
          <div key={isLogin ? "login" : "signup"} className="animate-auth-content space-y-6 md:space-y-8 w-full">
            {/* Header */}
            <div className="space-y-2 sm:space-y-3">
            <h2 className="font-sans text-[32px] leading-[1.15] md:text-[36px] font-bold text-white tracking-tight">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="font-sans text-sm text-[#bacac7]">
              {isLogin
                ? "Insira suas credenciais para acessar a plataforma."
                : "Preencha os dados abaixo para se cadastrar."}
            </p>
          </div>

          {/* Abas de Escolha (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="flex rounded-lg bg-[#1f1f24] p-1 border border-[#3c4948]/30">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-all ${role === "STUDENT"
                  ? "bg-linear-to-r from-[#62f9ee] to-[#7bd6d1] text-[#003734] shadow"
                  : "text-[#bacac7] hover:text-white"
                  }`}
              >
                Sou Talento
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-all ${role === "RECRUITER"
                  ? "bg-linear-to-r from-[#62f9ee] to-[#7bd6d1] text-[#003734] shadow"
                  : "text-[#bacac7] hover:text-white"
                  }`}
              >
                Sou Empresa
              </button>
            </div>
          )}

          {/* Erro Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 md:space-y-5">
              {/* Nome Input (Apenas no Cadastro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[#e3e2e8] mb-2" htmlFor="name">
                    {role === "STUDENT" ? "Nome Completo" : "Nome da Empresa"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLayers className="text-[#859491] text-lg" />
                    </div>
                    <input
                      className="block w-full h-[50px] pl-11 pr-4 bg-[#1f1f24] text-[#e3e2e8] border border-[#3c4948] rounded-lg focus:ring-2 focus:ring-[#62f9ee] focus:border-[#62f9ee] transition-all shadow-sm placeholder-[#859491] text-sm"
                      id="name"
                      placeholder={role === "STUDENT" ? "Ex: Joao" : "Ex: Nubank"}
                      required
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-[#e3e2e8] mb-2" htmlFor="email">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-[#859491] text-lg" />
                  </div>
                  <input
                    className="block w-full h-[50px] pl-11 pr-4 bg-[#1f1f24] text-[#e3e2e8] border border-[#3c4948] rounded-lg focus:ring-2 focus:ring-[#62f9ee] focus:border-[#62f9ee] transition-all shadow-sm placeholder-[#859491] text-sm"
                    id="email"
                    placeholder="seu@email.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-[#e3e2e8] mb-2" htmlFor="password">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-[#859491] text-lg" />
                  </div>
                  <input
                    className="block w-full h-[50px] pl-11 pr-12 bg-[#1f1f24] text-[#e3e2e8] border border-[#3c4948] rounded-lg focus:ring-2 focus:ring-[#62f9ee] focus:border-[#62f9ee] transition-all shadow-sm placeholder-[#859491] text-sm"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      className="text-[#859491] hover:text-white transition-colors focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <FiEyeOff className="text-[20px]" />
                      ) : (
                        <FiEye className="text-[20px]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Curso Input (Cadastro STUDENT) */}
              {!isLogin && role === "STUDENT" && (
                <div>
                  <label className="block text-sm font-semibold text-[#e3e2e8] mb-2" htmlFor="course">Curso</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLayers className="text-[#859491] text-lg" />
                    </div>
                    <input
                      className="block w-full h-[50px] pl-11 pr-4 bg-[#1f1f24] text-[#e3e2e8] border border-[#3c4948] rounded-lg focus:ring-2 focus:ring-[#62f9ee] focus:border-[#62f9ee] transition-all shadow-sm placeholder-[#859491] text-sm"
                      id="course"
                      placeholder="Gestão de TI, Gestão Empresarial..."
                      required
                      type="text"
                      value={course}
                      onChange={(e) => {
                        setCourse(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Instituição Input (Cadastro STUDENT) */}
              {!isLogin && role === "STUDENT" && (
                <div>
                  <label className="block text-sm font-semibold text-[#e3e2e8] mb-2" htmlFor="institution">Instituição / Faculdade</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLayers className="text-[#859491] text-lg" />
                    </div>
                    <input
                      className="block w-full h-[50px] pl-11 pr-4 bg-[#1f1f24] text-[#e3e2e8] border border-[#3c4948] rounded-lg focus:ring-2 focus:ring-[#62f9ee] focus:border-[#62f9ee] transition-all shadow-sm placeholder-[#859491] text-sm"
                      id="institution"
                      placeholder="Nome da Instituição"
                      required
                      type="text"
                      value={institution}
                      onChange={(e) => {
                        setInstitution(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password (Apenas no Login) */}
            {isLogin && (
              <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-[12px] pt-1">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 shrink-0 rounded border-[#3c4948] bg-[#1f1f24] text-[#62f9ee] focus:ring-[#62f9ee] focus:ring-offset-[#1a1b20]"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="ml-2 block text-sm text-[#bacac7] whitespace-nowrap" htmlFor="remember-me">
                    Lembrar de mim
                  </label>
                </div>
                <div className="text-sm shrink-0">
                  <a className="text-xs text-[#62f9ee] hover:text-[#3cdcd1] transition-colors font-medium hover:underline whitespace-nowrap" href="#">
                    Esqueceu sua senha?
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                disabled={isLoading}
                className="w-full h-[50px] flex justify-center items-center px-6 border border-transparent rounded-lg shadow-sm text-sm text-[#003734] bg-linear-to-r from-[#62f9ee] to-[#7bd6d1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1b20] focus:ring-[#62f9ee] transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                <span className="mr-2">
                  {isLoading
                    ? "Entrando..."
                    : isLogin
                      ? "Entrar na plataforma"
                      : "Criar Conta"}
                </span>
                <FiArrowRight className="text-[20px]" />
              </button>
            </div>
          </form>

          {/* Divider */}
          {isLogin && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#3c4948]/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-[#121317] text-xs text-[#859491]">
                    ou continue com
                  </span>
                </div>
              </div>
              {/* Social Login */}
              <div className="mt-6">
                <button
                  disabled
                  className="w-full h-[50px] inline-flex justify-center items-center px-4 border border-[#3c4948] rounded-lg bg-transparent hover:bg-[#1f1f24] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1b20] focus:ring-[#3c4948] text-sm font-semibold text-[#e3e2e8] opacity-50 cursor-not-allowed"
                  type="button"
                  title="OAuth temporariamente desabilitado"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Continuar com Google</span>
                </button>
              </div>
            </div>
          )}

          {/* Trocar entre Login e Cadastro */}
          <p className="mt-6 text-center text-sm text-[#bacac7]">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-medium text-[#62f9ee] hover:text-[#3cdcd1] hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
          </div>
        </div>
      </section>
    </main>
  );
}
