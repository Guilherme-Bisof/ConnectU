"use client";

import { useEffect, useState } from "react";
import { FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { StudentJobCard } from "@/app/components/jobs/StudentJobCard";
import { StudentJobDetailPanel } from "@/app/components/jobs/StudentJobDetailPanel";
import { calculateMatch } from "@/utils/matchAlgorithm";
import { StudentFullJobModal } from "@/app/components/jobs/StudentFullJobModal";

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

function getMockData(jobId: string) {
  const num = jobId.charCodeAt(jobId.length - 1) || 0;
  return {
    location: num % 2 === 0 ? "São Paulo, SP" : "Remoto",
    salaryRange: num % 3 === 0 ? "R$ 4.000 - R$ 5.500" : "R$ 2.500 - R$ 3.500",
    transparencyScore: 80 + (num % 20),
  };
}

export default function VagasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<MatchedJobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

            if (data.length > 0) {
              setSelectedJobId(data[0].id);
            }
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
        alert("Candidatura enviada com sucesso! Boa sorte!");
        setAppliedJobIds((prev) => [...prev, jobId]);
      } else {
        const errorData = await response.json();
        alert(
          errorData.error === "Você já se candidatou a esta vaga!"
            ? "Você já se candidatou a esta vaga!"
            : `Erro: ${errorData.error}`,
        );
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

  const enrichedJobs = matchedJobs.map((job) => {
    const mocks = getMockData(job.id);
    const matchRes = calculateMatch(
      user.skills || [],
      job.requiredSkills,
      job.desirableSkills || [],
    );

    return {
      originalId: job.id,
      enrichedData: {
        id: job.id,
        title: job.title,
        type: job.type,
        requiredSkills: job.requiredSkills,
        desirableSkills: job.desirableSkills,
        description: job.description,
        companyName: job.company.name,
        applications: job.applications,
        ...mocks,
      },
      matchResult: matchRes,
    };
  });

  const selectedData = enrichedJobs.find((j) => j.originalId === selectedJobId);

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vagas & Match</h1>
        <p className="text-zinc-400">
          Vagas recomendadas com base no seu perfil e objetivos,{" "}
          {user.name.split(" ")[0]}.
        </p>
      </div>

      {/* Grid Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/*Coluna Esqueda: Lista de vagas */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
          {enrichedJobs.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
              Nenhuma vaga encontrada no momento.
            </div>
          ) : (
            enrichedJobs.map((jobObj) => (
              <StudentJobCard
                key={jobObj.originalId}
                job={jobObj.enrichedData}
                matchScore={jobObj.matchResult.score}
                isSelected={selectedJobId === jobObj.originalId}
                onClick={() => setSelectedJobId(jobObj.originalId)}
              />
            ))
          )}
        </div>

        {/* Coluna direita: Painel */}
        <div className="lg:col-span-7 h-[calc(100vh-200px)] sticky top-4">
          <StudentJobDetailPanel
            job={selectedData?.enrichedData || null}
            matchResult={selectedData?.matchResult || null}
            onOpenDetails={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* Detalhes da vaga */}
      {selectedData && (
        <StudentFullJobModal
          job={selectedData.enrichedData}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApply={(id) => {
            handleApply(id);
            setIsModalOpen(false);
          }}
          hasApplied={
            selectedData.enrichedData.applications?.some(
              (app: { userId: string}) => app.userId === user?.id,
            ) || appliedJobIds.includes(selectedData.originalId)
          }
        />
      )}
    </div>
  );
}
