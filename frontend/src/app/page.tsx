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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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
          setIsLogin(true);
        }
      } else {
        alert(data.error || "Erro ao processar requisição");
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
      alert("Não foi possível conectar ao servidor.");
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
            <div className="mb-6 flex rounded-lg bg-zinc-900 p-1">
              <button
                onClick={() => setRole("STUDENT")}
                className={`w-1/2 rounded-md py-2 text-sm font-medium transition-all ${
                  role === "STUDENT"
                    ? "bg-blue-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sou Talento
              </button>
              <button
                onClick={() => setRole("RECRUITER")}
                className={`w-1/2 rounded-md py-2 text-sm font-medium transition-all ${
                  role === "RECRUITER"
                    ? "bg-blue-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sou Empresa
              </button>
            </div>
          )}

          {/* Campos do Formulário */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nome */}
            {!isLogin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  {role === "STUDENT" ? "Nome Completo" : "Nome da Empresa"}
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={role === "STUDENT" ? "Ex: Joao" : "Ex: Nubank"}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {/* Curso e Instituição */}
            {!isLogin && role === "STUDENT" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Curso
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Gestão de TI, Gestão Empresarial..."
                  ></input>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Institução / Faculdade
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nome da Institução"
                  ></input>
                </div>
              </>
            )}

            <button
              disabled={loading}
              type="submit"
              className="mt-6 w-full rounded-md bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Processando..."
                : isLogin
                  ? "Entrar na Plataforma"
                  : "Criar Conta"}
            </button>
          </form>

          {/* Trocar entre Login e Cadastro */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-500 hover:text-blue-400 hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
