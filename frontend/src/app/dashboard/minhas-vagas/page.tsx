"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiBriefcase,
  FiX,
  FiEdit2,
  FiUsers,
  FiPower,
  FiChevronDown,
  FiChevronUp,
  FiBookOpen,
  FiTrash2,
} from "react-icons/fi";

interface UserData {
  id: string;
  name: string;
  role: string;
  companyId?: string;
}

interface ApplicantUser {
  id: string;
  name: string;
  course?: string;
  institution?: string;
  skills?: string[];
}

interface Applicant {
  userId: string;
  user?: ApplicantUser;
}

interface JobData {
  id: string;
  title: string;
  type: string;
  description?: string;
  requiredSkills: string[];
  desirableSkills: string[];
  isInternship: boolean;

  isActive: boolean;
  applications?: Applicant[];
}

export default function MinhasVagasPage() {
  const router = useRouter();

  const [vagas, setVagas] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // Estados de controle da UI
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Estado para o Modal do Aluno
  const [selectedStudent, setSelectedStudent] = useState<ApplicantUser | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJobData, setNewJobData] = useState({
    title: "",
    type: "Tempo Integral",
    description: "",
    skillsInput: "",
    desirableSkillsInput: "",
    isInternship: false,
  });

  // Estado modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobData, setEditJobData] = useState({
    title: "",
    type: "Tempo Integral",
    description: "",
    skillsInput: "",
    desirableSkillsInput: "",
    isInternship: false,
  });

  const fetchMinhasVagas = async (companyId: string) => {
    try {
      const token = localStorage.getItem("connectu_token");

      const res = await fetch(`https://connectu-gd1z.onrender.com/jobs/company/${companyId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVagas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("connectu_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(parsedUser);

      if (parsedUser.role === "RECRUITER" && parsedUser.companyId) {
        fetchMinhasVagas(parsedUser.companyId);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleExcluir = async (jobId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta vaga permanentemente?"))
      return;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`https://connectu-gd1z.onrender.com/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setVagas((prev) => prev.filter((vaga) => vaga.id !== jobId));
      } else {
        alert("Erro ao excluir a vaga.");
      }
    } catch (error) {
      console.error("Erro ao excluir vaga:", error);
    }
  };

  const handleRemoveApplicant = async (
    jobId: string,
    userId: string,
    studentName: string,
  ) => {
    if (!confirm(`Tem certeza que deseja remover ${studentName} desta vaga?`))
      return;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${jobId}/applicants/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok || res.status === 204) {
        // Atualiza a lista na tela na hora, removendo o aluno daquela vaga
        setVagas((prev) =>
          prev.map((vaga) => {
            if (vaga.id === jobId) {
              return {
                ...vaga,
                applications: vaga.applications?.filter(
                  (app) => app.userId !== userId,
                ),
              };
            }
            return vaga;
          }),
        );
      } else {
        alert("Erro ao remover o candidato.");
      }
    } catch (error) {
      console.error("Erro ao remover candidato:", error);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`https://connectu-gd1z.onrender.com/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setVagas((prev) =>
          prev.map((vaga) =>
            vaga.id === jobId ? { ...vaga, isActive: !currentStatus } : vaga,
          ),
        );
      } else {
        alert("Erro ao atualizar o status da vaga.");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return alert("Erro: Empresa não identificada.");

    setIsSubmitting(true);

    const requiredSkills = newJobData.skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    const desirableSkills = newJobData.desirableSkillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch("https://connectu-gd1z.onrender.com/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newJobData.title,
          type: newJobData.type,
          description: newJobData.description,
          requiredSkills,
          desirableSkills,
          isInternship: newJobData.isInternship,
          companyId: user.companyId,
        }),
      });

      if (res.ok) {
        const createdJob = await res.json();
        setVagas((prev) => [{ ...createdJob, applications: [] }, ...prev]);
        setNewJobData({
          title: "",
          type: "Tempo Integral",
          description: "",
          skillsInput: "",
          desirableSkillsInput: "",
          isInternship: false,
        });
        setIsModalOpen(false);
      } else {
        alert("Erro ao criar vaga. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao criar:", error);
      alert("Erro de conexão ao criar vaga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  //Função para abrir o modal de edição já preenchido com os dados da vaga criada
  const openEditModal = (vaga: JobData) => {
    setEditingJobId(vaga.id);
    setEditJobData({
      title: vaga.title,
      type: vaga.type,
      description: vaga.description || "",
      skillsInput: vaga.requiredSkills.join(", "),
      desirableSkillsInput: vaga.desirableSkills?.join(", ") || "",
      isInternship: vaga.isInternship || false,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJobId) return;

    setIsSubmitting(true);

    const requiredSkills = editJobData.skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    const desirableSkills = newJobData.desirableSkillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`https://connectu-gd1z.onrender.com/jobs/${editingJobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editJobData.title,
          type: editJobData.type,
          description: editJobData.description,
          requiredSkills,
          desirableSkills,
          isInternship: newJobData.isInternship,
        }),
      });

      if (res.ok) {
        const updatedJob = await res.json();

        setVagas((prev) =>
          prev.map((vaga) =>
            vaga.id === editingJobId ? { ...vaga, ...updatedJob } : vaga,
          ),
        );
        setIsEditModalOpen(false);
        setEditingJobId(null);
      } else {
        alert("Erro ao atualizar vaga. Tente novamente");
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro de conexão ao atualizar vaga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpandJob = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Carregando painel de vagas...
      </div>
    );
  }

  if (!user || user.role !== "RECRUITER") {
    return (
      <div className="p-8 text-center text-red-400 font-medium bg-red-400/10 rounded-lg border border-red-500/20 max-w-2xl mx-auto mt-10">
        Acesso negado. Esta página é exclusiva para perfis de
        Empresa/Recrutador.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-12 relative">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiBriefcase className="text-blue-500" /> Minhas Vagas
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie as oportunidades publicadas pela sua empresa.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
        >
          <FiPlus /> Nova Vaga
        </button>
      </div>

      {/* Lista de Vagas */}
      <div className="space-y-4">
        {vagas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <FiBriefcase className="mx-auto mb-4 text-4xl text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">
              Nenhuma vaga publicada
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Clique no botão &quot;Nova Vaga&quot; para começar a recrutar
              talentos.
            </p>
          </div>
        ) : (
          vagas.map((vaga) => {
            const isExpanded = expandedJobId === vaga.id;
            const totalCandidatos = vaga.applications?.length || 0;

            return (
              <div key={vaga.id} className="flex flex-col gap-2">
                {/* Card Principal da Vaga */}
                <div
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl border p-6 transition-all ${
                    vaga.isActive
                      ? "bg-zinc-900 border-zinc-800 hover:border-blue-500/30"
                      : "bg-zinc-950 border-zinc-800/50 opacity-75"
                  }`}
                >
                  {/* Informações da Vaga */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-white">
                        {vaga.title}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          vaga.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {vaga.isActive ? "Ativa" : "Pausada"}
                      </span>

                      {vaga.isInternship && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Estágio (Restrito)
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-zinc-400 mb-3 line-clamp-1">
                      {vaga.type} • {vaga.description || "Sem descrição"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {vaga.requiredSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}

                      {vaga.desirableSkills?.map((skill, i) => (
                        <span
                          key={`des-${i}`}
                          className="text-xs bg-purple-900/20 text-purple-300 px-2 py-1 rounded-md border border-purple-900/30"
                          title="Desejável / Plus (Peso 1)"
                        >
                          +{skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ações e Métricas */}
                  <div className="flex flex-col md:items-end gap-4 shrink-0 border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                    <button
                      disabled={totalCandidatos === 0}
                      onClick={() => toggleExpandJob(vaga.id)}
                      className={`flex items-center justify-between md:justify-end gap-2 px-3 py-1.5 rounded-lg border w-full md:w-auto transition-all ${
                        totalCandidatos > 0
                          ? "text-blue-400 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                          : "text-zinc-500 bg-zinc-800/30 border-zinc-800 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiUsers />
                        <span className="text-sm font-medium">
                          {totalCandidatos}{" "}
                          {totalCandidatos === 1 ? "Candidato" : "Candidatos"}
                        </span>
                      </div>
                      {totalCandidatos > 0 &&
                        (isExpanded ? <FiChevronUp /> : <FiChevronDown />)}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() =>
                          handleToggleStatus(vaga.id, vaga.isActive)
                        }
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-md transition-colors"
                        title={vaga.isActive ? "Pausar Vaga" : "Ativar Vaga"}
                      >
                        <FiPower
                          className={
                            vaga.isActive ? "text-yellow-400" : "text-green-400"
                          }
                        />
                      </button>

                      <button
                        onClick={() => openEditModal(vaga)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-blue-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-md transition-colors"
                        title="Editar Vaga"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        onClick={() => handleExcluir(vaga.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-md transition-colors border border-red-500/10"
                        title="Excluir Vaga"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded &&
                  vaga.applications &&
                  vaga.applications.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 ml-2 mr-2 -mt-1 animate-fadeIn space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">
                        Alunos que aplicaram:
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {vaga.applications.map((app, idx) => {
                          const aluno = app.user;
                          if (!aluno) return null;

                          // CÁLCULO DE MATCH EM TEMPO REAL (Case Insensitive)
                          const requiredCount = vaga.requiredSkills.length;
                          const matchCount =
                            aluno.skills?.filter((s) =>
                              vaga.requiredSkills.some(
                                (req) => req.toLowerCase() === s.toLowerCase(),
                              ),
                            ).length || 0;
                          const matchPercentage =
                            requiredCount > 0
                              ? Math.round((matchCount / requiredCount) * 100)
                              : 0;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedStudent(aluno)}
                              className="group relative bg-zinc-900 border border-zinc-800/60 p-4 rounded-lg flex flex-col justify-between cursor-pointer transition-all hover:bg-zinc-800/50 hover:border-blue-500/40"
                            >
                              <div className="absolute top-3 right-3 text-xs font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
                                {matchPercentage}% Match
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors pr-16">
                                  {aluno.name}
                                </h4>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {aluno.course || "Curso não informado"}
                                </p>
                              </div>

                              {/* Skills do Aluno */}
                              {aluno.skills && aluno.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {aluno.skills.slice(0, 5).map((s, i) => {
                                    const isRequired = vaga.requiredSkills.some(
                                      (reqSkill) =>
                                        reqSkill.toLowerCase() ===
                                        s.toLowerCase(),
                                    );
                                    return (
                                      <span
                                        key={i}
                                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          isRequired
                                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                            : "bg-zinc-800 text-zinc-400"
                                        }`}
                                      >
                                        {s}
                                      </span>
                                    );
                                  })}
                                  {aluno.skills.length > 5 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                                      +{aluno.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/*Botão de remover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveApplicant(
                                    vaga.id,
                                    aluno.id,
                                    aluno.name,
                                  );
                                }}
                                className="absolute bottom-3 right-3 text-zinc-500 hover:text-red-400 bg-zinc-800/40 hover:bg-red-500/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover candidato"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: PERFIL RESUMIDO DO ALUNO */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md"
            >
              <FiX />
            </button>

            <div className="text-center mb-6">
              {/* Avatar "Fake" usando as Iniciais */}
              <div className="w-16 h-16 bg-blue-900 text-blue-400 flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-3 border-2 border-blue-500/30">
                {selectedStudent.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-white">
                {selectedStudent.name}
              </h2>
              <p className="text-sm text-blue-400 mt-1">Candidato(a)</p>
            </div>

            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Formação Acadêmica
                </p>
                <div className="flex items-start gap-2 text-zinc-300 text-sm">
                  <FiBookOpen className="mt-1 shrink-0 text-zinc-500" />
                  <div>
                    <p className="font-medium text-white">
                      {selectedStudent.course || "Curso não preenchido"}
                    </p>
                    <p className="text-zinc-400">
                      {selectedStudent.institution ||
                        "Instituição não informada"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Todas as Competências
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills &&
                  selectedStudent.skills.length > 0 ? (
                    selectedStudent.skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 italic">
                      Nenhuma competência cadastrada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() =>
                  router.push(`/dashboard/perfil/${selectedStudent.id}`)
                }
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Ver Perfil Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA VAGA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md"
            >
              <FiX />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              Criar Nova Vaga
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Título da Vaga
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Desenvolvedor Front-end Junior"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={newJobData.title}
                  onChange={(e) =>
                    setNewJobData({ ...newJobData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Tipo / Modelo
                </label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={newJobData.type}
                  onChange={(e) =>
                    setNewJobData({ ...newJobData, type: e.target.value })
                  }
                >
                  <option value="Tempo Integral">Tempo Integral</option>
                  <option value="Meio Período">Meio Período</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva as responsabilidades e requisitos básicos..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                  value={newJobData.description}
                  onChange={(e) =>
                    setNewJobData({
                      ...newJobData,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Skills Necessárias (separadas por vírgula)
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: React, JavaScript, Figma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={newJobData.skillsInput}
                  onChange={(e) =>
                    setNewJobData({
                      ...newJobData,
                      skillsInput: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300 ml-1">
                  Skills Desejáveis / Plus (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Docker, AWS, UI/UX"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={newJobData.desirableSkillsInput}
                  onChange={(e) =>
                    setNewJobData({
                      ...newJobData,
                      desirableSkillsInput: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isInternship"
                  checked={newJobData.isInternship}
                  onChange={(e) =>
                    setNewJobData({
                      ...newJobData,
                      isInternship: e.target.checked,
                    })
                  }
                  className="w-5 h-5 border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-950"
                />
                <label
                  htmlFor="isInternship"
                  className="text-sm font-medium text-zinc-300 cursor-pointer"
                >
                  {" "}
                  Esta vaga é exclusiva para Estágio?{" "}
                  <span className="text-xs text-zinc-500">(Filtra alunos que faltam 1+ anos para terminar o curso)</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Criando..." : "Publicar Vaga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDITAR VAGA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md"
            >
              <FiX />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">Editar Vaga</h2>

            <form onSubmit={handleUpdateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Título da Vaga
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={editJobData.title}
                  onChange={(e) =>
                    setEditJobData({ ...editJobData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Tipo / Modelo
                </label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={editJobData.type}
                  onChange={(e) =>
                    setEditJobData({ ...editJobData, type: e.target.value })
                  }
                >
                  <option value="Tempo Integral">Tempo Integral</option>
                  <option value="Meio Período">Meio Período</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                  value={editJobData.description}
                  onChange={(e) =>
                    setEditJobData({
                      ...editJobData,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Skills Necessárias (separadas por vírgula)
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={editJobData.skillsInput}
                  onChange={(e) =>
                    setEditJobData({
                      ...editJobData,
                      skillsInput: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
