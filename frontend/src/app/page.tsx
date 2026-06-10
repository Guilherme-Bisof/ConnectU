"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("STUDENT");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    course: "",
    institution: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const endpoint = isLogin ? "/login" : "/users";
    const url = `https://connectu-gd1z.onrender.com${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role,
          skills: [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("connectu_user", JSON.stringify(data.user));
          localStorage.setItem("connectu_token", data.token);

          router.push("/dashboard");
        } else {
          alert("Conta criada com sucesso! Agora faça o login.");
        }
      } else {
        setErrorMsg(data.error || "Ocorreu um erro.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      {/* LADO ESQUERDO: Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-zinc-900 p-12 lg:flex">
        {/* Efeito visual: */}
        <div className="absolute left-[10%] top-[10%] h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]"></div>

        <div className="z-10">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            ConnectU
          </h1>
        </div>

        <div className="z-10">
          <h2 className="mb-4 text-3xl font-medium leading-tight">
            Onde o seu talento encontra a oportunidade certa.
          </h2>
          <p className="text-lg text-zinc-400">
            Junte-se à plataforma que conecta talentos de diversos cursos com
            empresas de forma inteligente através de compatibilidade de perfil.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Cabeçalho */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-semibold">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-zinc-400">
              {isLogin
                ? "Insira suas credenciais para acessar a plataforma."
                : "Preencha os dados abaixo para começar."}
            </p>
          </div>

          {/* Abas de Escolha: */}
          {!isLogin && (
            <div className="mb-6 flex rounded-lg bg-zinc-950 p-1 border border-zinc-800/60">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  role === "STUDENT"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sou Aluno
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  role === "RECRUITER"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sou Recrutador
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Campos do Formulário */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nome */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {role === "STUDENT" ? "Nome Completo" : "Nome do Recrutador"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-blue-500"
                  placeholder={
                    role === "STUDENT" ? "Seu nome completo" : "Seu nome (Ex: João do RH)"
                  }
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600  outline-none transition-all focus:border-blue-500"
                placeholder="exemplo@email.com"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Senha
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            {/* Curso e Instituição */}
            {!isLogin && role === "STUDENT" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Curso
                  </label>
                  <input
                    type="text"
                    required={role === "STUDENT"}
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-blue-500"
                    placeholder="Nome do seu curso"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Instituição de Ensino
                  </label>
                  <input
                    type="text"
                    required={role === "STUDENT"}
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-blue-500"
                    placeholder="Nome da Universidade / Faculdade"
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 shadow-md shadow-blue-600/10 active:scale-[0.99] disabled:opacity-50"
            >
              {loading
                ? "Processando..."
                : isLogin
                  ? "Entrar na Plataforma"
                  : "Criar Minha Conta"}
            </button>
          </form>

          {/* Trocar entre Login e Cadastro */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
              }}
              className="font-bold text-blue-500 hover:text-blue-400 hover:underline transition-colors"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
