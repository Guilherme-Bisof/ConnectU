"use client";

import { useEffect, useState } from "react";
import {
  FiBriefcase,
  FiZap,
  FiTarget,
  FiMapPin,
  FiLock,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  name: string;
  role: string;
  course?: string;
  institution?: string;
  endDate?: string;
  skills?: string[];
}

interface MatchedJobData {
  id: string;
  title: string;
  type: string;
  description?: string;
  requiredSkills: string[];
  desirableSkills: string[];
  isInternship: boolean;
  hasCoreSkills: boolean;

  matchPercentage: number;
  company: {
    name: string;
  };
  applications?: { userId: string }[];
}

export default function VagasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<MatchedJobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<MatchedJobData | null>(null);

  const isProfileIncomplete =
    user?.role === "STUDENT" &&
    (!user.course?.trim() ||
      !user.institution?.trim() ||
      !user.endDate?.trim() ||
      !user.skills ||
      user.skills.length === 0);

  //  Carrega o usuário
  useEffect(() => {
    const storedUser = localStorage.getItem("connectu_user");
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }
  }, []);

  //  Busca os Matches no Backend
  useEffect(() => {
    async function fetchMatches() {
      if (user && user.role === "STUDENT" && !isProfileIncomplete) {
        try {
          const token = localStorage.getItem("connectu_token");
          const res = await fetch(
            `https://connectu-gd1z.onrender.com/jobs/match/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setMatchedJobs(data);
          }
        } catch (error) {
          console.error("Erro ao buscar vagas recomendadas:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchMatches();
    }
  }, [user, isProfileIncomplete]);

  // Função para candidatar-se à vaga
  async function handleApply(jobId: string) {
    if (!user) return;

    try {
      const token = localStorage.getItem("connectu_token");
      const response = await fetch(
        "https://connectu-gd1z.onrender.com/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            jobId: jobId,
          }),
        },
      );

      if (response.ok) {
        alert("Candidatura enviada com sucesso! Boa sorte! 🚀");
        setAppliedJobIds((prev) => [...prev, jobId]);
      } else {
        const errorData = await response.json();
        if (errorData.error === "Você já se candidatou a esta vaga!") {
          alert("Você já se candidatou a esta vaga!");
          setAppliedJobIds((prev) => [...prev, jobId]);
        } else {
          alert(`Erro: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar candidatura:", error);
      alert("Erro de conexão com o servidor.");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Carregando o motor de inteligência...
      </div>
    );
  }

  if (!user || user.role !== "STUDENT") {
    return (
      <div className="p-8 text-center text-zinc-400">
        Esta página é exclusiva para alunos encontrarem suas vagas ideais.
      </div>
    );
  }

  if (isProfileIncomplete) {
    return (
      <div className="mx-auto max-w-5xl pb-12 flex flex-col items-center justify-center min-h-[60vh] text-center animate-FadeIn">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 max-w-xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center text-2xl mb-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <FiLock />
          </div>
          <p className="text-zinc-300 leading-relaxed text-sm md:text-base max-w-md mb-8">
            Para visualizarmos as vagas ideais e calcularmos a sua
            compatibilidade com as empresas, precisamos conhecer você um pouco
            melhor.
          </p>
          <button
            onClick={() => router.push("/dashboard/perfil?redirected=true")}
            className="border border-zinc-700 bg-zinc-800 text-blue-400 hover:bg-zinc-700 hover:text-blue-300 font-semibold px-8 py-2.5 rounded-lg text-sm transition-all shadow-md"
          >
            Completar perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Header da Página */}
      <div className="mb-8 rounded-2xl border border-blue-500/30 bg-blue-900/10 p-8 shadow-[0_0_30px_rgba(37,99,235,0.05)] backdrop-blur-md">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"> Oportunidades & Match
        </h1>
        <p className="mt-2 text-zinc-400 max-w-2xl">
          Nosso algoritmo cruzou o seu perfil com as vagas abertas. Aqui estão
          as posições com maior probabilidade de sucesso para você,{" "}
          {user.name.split(" ")[0]}!
        </p>
      </div>

      {/* Lista de Vagas */}
      <div className="space-y-6">
        {matchedJobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <FiTarget className="mx-auto mb-4 text-4xl text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">
              Nenhum Match encontrado ainda
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Adicione mais competências (skills) no seu Perfil para que o nosso
              motor encontre as vagas perfeitas para você.
            </p>
          </div>
        ) : (
          matchedJobs.map((job) => {
            const jaAplicou =
              job.applications?.some((app) => app.userId === user?.id) ||
              appliedJobIds.includes(job.id);

            return (
              <div
                key={job.id}
                className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.1)]"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Info da Vaga */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold text-white">
                        {job.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                      <span className="flex items-center gap-1">
                        <FiBriefcase /> {job.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMapPin /> {job.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {/* Skills Obrigatórias */}
                      {job.requiredSkills.map((skill, index) => {
                        const hasSkill = user?.skills?.some(
                          (userSkill) =>
                            userSkill.toLowerCase() === skill.toLowerCase(),
                        );
                        return (
                          <span
                            key={`req-${index}`}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium border ${hasSkill ? "bg-blue-900/30 text-blue-300 border-blue-800/50" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}
                          >
                            {skill} {hasSkill && "✓"}
                          </span>
                        );
                      })}

                      {/* Separador Visual + Skills Desejáveis */}
                      {job.desirableSkills &&
                        job.desirableSkills.length > 0 && (
                          <>
                            <div className="h-4 w-px bg-zinc-700 mx-1"></div>
                            {job.desirableSkills.map((skill, index) => {
                              const hasSkill = user?.skills?.some(
                                (userSkill) =>
                                  userSkill.toLowerCase() ===
                                  skill.toLowerCase(),
                              );
                              return (
                                <span
                                  key={`des-${index}`}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium border ${hasSkill ? "bg-purple-900/30 text-purple-300 border-purple-800/50" : "bg-zinc-800/80 text-zinc-500 border-zinc-700/80"}`}
                                  title="Diferencial / Plus"
                                >
                                  +{skill} {hasSkill && "✓"}
                                </span>
                              );
                            })}
                          </>
                        )}
                    </div>
                    {job.description && (
                      <div className="mt-3">
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {job.description}
                        </p>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="mt-1 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-all"
                        >
                          {" "}
                          Ver descrição completa
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Motor de Match (Barra e Botão) */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col items-center md:items-end justify-center rounded-lg bg-zinc-950 p-4 border border-zinc-800/50">
                    <div className="text-center md:text-right w-full mb-3">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
                        {job.matchPercentage}%
                      </span>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">
                        Compatibilidade
                      </p>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${job.matchPercentage}%` }}
                      ></div>
                    </div>

                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={jaAplicou}
                      className={`w-full rounded-md px-4 py-2 text-sm font-bold text-white transition-all ${
                        jaAplicou
                          ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]"
                      }`}
                    >
                      {jaAplicou ? "Candidatura Enviada ✓" : "Aplicar agora"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DESCRIÇÃO COMPLETA DA VAGA  */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="flex items-start justify-between p-6 border-b border-zinc-800 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedJob.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1 font-medium text-zinc-300">
                    <FiBriefcase className="text-blue-500" />{" "}
                    {selectedJob.company.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin /> {selectedJob.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-400">
                    Seu Match com esta vaga
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Baseado nas suas competências e exigências da empresa.
                  </p>
                </div>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
                  {selectedJob.matchPercentage}%
                </span>
              </div>

              {/*Alerta de Mentoria (Renderiza se o aluno não tiver as skills obrigatórias) */}
              {!selectedJob.hasCoreSkills && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 animate-fadeIn shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <div className="mt-0.5">
                    <FiZap className="text-amber-500 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-500">
                      Dica de Mentoria: Foco nos estudos!
                    </p>
                    <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                      Notamos que você ainda não possui algumas competências
                      obrigatórias. Para aumentar suas chances nesta vaga,
                      recomendamos focar em:{" "}
                      <strong className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {selectedJob.requiredSkills
                          .filter(
                            (skill) =>
                              !user?.skills?.some(
                                (userSkill) =>
                                  userSkill.toLowerCase() ===
                                  skill.toLowerCase(),
                              ),
                          )
                          .join(", ")}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Skills em destaque */}
              <div className="space-y-4">
                {/* Obrigatórias */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">
                    Competências Obrigatórias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requiredSkills.map((skill, index) => {
                      const hasSkill = user?.skills?.some(
                        (userSkill) =>
                          userSkill.toLowerCase() === skill.toLowerCase(),
                      );
                      return (
                        <span
                          key={`req-${index}`}
                          className={`rounded-full px-3 py-1 text-xs font-medium border ${
                            hasSkill
                              ? "bg-blue-900/30 text-blue-300 border-blue-800/50"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }`}
                        >
                          {skill} {hasSkill && "✓"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Desejáveis / Plus */}
                {selectedJob.desirableSkills &&
                  selectedJob.desirableSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                        Diferenciais / Desejáveis (Plus)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.desirableSkills.map((skill, index) => {
                          const hasSkill = user?.skills?.some(
                            (userSkill) =>
                              userSkill.toLowerCase() === skill.toLowerCase(),
                          );
                          return (
                            <span
                              key={`des-${index}`}
                              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                                hasSkill
                                  ? "bg-purple-900/30 text-purple-300 border-purple-800/50"
                                  : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                              }`}
                              title="Diferencial"
                            >
                              +{skill} {hasSkill && "✓"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  Sobre a Vaga
                </h3>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/50">
                  {selectedJob.description}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 shrink-0 bg-zinc-900 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>

              {(() => {
                const jaAplicou =
                  selectedJob.applications?.some(
                    (app) => app.userId === user?.id,
                  ) || appliedJobIds.includes(selectedJob.id);
                return (
                  <button
                    onClick={() => {
                      handleApply(selectedJob.id);
                      setSelectedJob(null); // Fecha o modal após aplicar
                    }}
                    disabled={jaAplicou}
                    className={`rounded-lg px-8 py-2.5 text-sm font-bold text-white transition-all ${
                      jaAplicou
                        ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    }`}
                  >
                    {jaAplicou ? "Candidatura Enviada ✓" : "Aplicar agora"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
