"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiBriefcase,
} from "react-icons/fi";

import { StudentProfileModal } from "@/app/components/jobs/StudentProfileModal";
import { JobFormModal } from "@/app/components/jobs/JobFormModal";
import { JobCard } from "@/app/components/jobs/JobCard";
import { JobDetailsPanel } from "@/app/components/jobs/JobDetailsPanel";

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
  status?: string;
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Computed selected job
  const selectedJob = vagas.find(v => v.id === selectedJobId) || null;

  // Estado para o Modal do Aluno
  const [selectedStudent, setSelectedStudent] = useState<{ user: ApplicantUser; jobId: string; status: string } | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJobData, setNewJobData] = useState({
    title: "",
    type: "Tempo Integral",
    description: "",
    requiredSkills: [] as string[],
    desirableSkills: [] as string[],
    isInternship: false,
  });

  // Estado modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobData, setEditJobData] = useState({
    title: "",
    type: "Tempo Integral",
    description: "",
    requiredSkills: [] as string[],
    desirableSkills: [] as string[],
    isInternship: false,
  });

  const fetchMinhasVagas = async (companyId: string) => {
    try {
      const token = localStorage.getItem("connectu_token");

      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/company/${companyId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setVagas(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
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
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok || res.status === 204) {
        setVagas((prev) => prev.filter((vaga) => vaga.id !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId(null);
        }
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
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${jobId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        },
      );

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

  const handleChangeStatus = async (jobId: string, userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${jobId}/applicants/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setVagas((prev) =>
          prev.map((vaga) => {
            if (vaga.id === jobId) {
              return {
                ...vaga,
                applications: vaga.applications?.map((app) =>
                  app.userId === userId ? { ...app, status: newStatus } : app
                ),
              };
            }
            return vaga;
          })
        );
        setSelectedStudent(null);
      } else {
        alert("Erro ao alterar o status do candidato.");
      }
    } catch (error) {
      console.error("Erro ao mudar status do candidato:", error);
    }
  };

  const handleStartChat = async (jobId: string, userId: string) => {
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch("https://connectu-gd1z.onrender.com/rooms/professional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId, studentId: userId }),
      });

      if (res.ok) {
        const room = await res.json();
        router.push(`/dashboard/chat/${room.id}`);
      } else {
        alert("Erro ao iniciar chat profissional.");
      }
    } catch (error) {
      console.error("Erro ao iniciar chat:", error);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return alert("Erro: Empresa não identificada.");

    setIsSubmitting(true);

    const requiredSkills = newJobData.requiredSkills;
    const desirableSkills = newJobData.desirableSkills;

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
          requiredSkills: [],
          desirableSkills: [],
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

  //Função para abrir o modal de edição já preenchido
  const openEditModal = (vaga: JobData) => {
    setEditingJobId(vaga.id);
    setEditJobData({
      title: vaga.title,
      type: vaga.type,
      description: vaga.description || "",
      requiredSkills: vaga.requiredSkills || [],
      desirableSkills: vaga.desirableSkills || [],
      isInternship: vaga.isInternship || false,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJobId) return;

    setIsSubmitting(true);

    const requiredSkills = editJobData.requiredSkills;
    const desirableSkills = editJobData.desirableSkills;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${editingJobId}`,
        {
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
            isInternship: editJobData.isInternship,
          }),
        },
      );

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
    <div className="mx-auto max-w-7xl pb-12 relative px-4 xl:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2a2d32]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#316cf4]/10 rounded-lg text-[#316cf4]">
              <FiBriefcase className="text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Minhas Vagas
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-[420px]">
            Gerencie seu funil de recrutamento, acompanhe candidatos e encontre os talentos com maior fit para sua empresa.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#316cf4] hover:bg-[#2556cc] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <FiPlus className="text-lg" /> Nova Vaga
        </button>
      </div>

      {/* Master-Detail */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Lista */}
        <div className="w-full lg:w-100 xl:w-112.5 shrink-0 flex flex-col gap-4">
          {vagas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
              <FiBriefcase className="mx-auto mb-4 text-4xl text-zinc-600" />
              <h3 className="text-lg font-bold text-zinc-300">
                Nenhuma vaga publicada
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Clique no botão &quot;Nova Vaga&quot; para começar a recrutar talentos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2">
              {vagas.map((vaga) => (
                <JobCard
                  key={vaga.id}
                  vaga={vaga}
                  isSelected={selectedJobId === vaga.id}
                  onSelectJob={(v) => setSelectedJobId(v.id)}
                  onToggleStatus={handleToggleStatus}
                  onEdit={openEditModal}
                  onDelete={handleExcluir}
                />
              ))}
            </div>
          )}
        </div>

        {/* Direita: Painel */}
        <div className="flex-1 w-full">
          <JobDetailsPanel
            vaga={selectedJob}
            onSelectStudent={setSelectedStudent}
            onRemoveApplicant={handleRemoveApplicant}
          />
        </div>
      </div>

      {/* MODAL PERFIL RESUMIDO DO ALUNO */}
      <StudentProfileModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        studentData={selectedStudent}
        onChangeStatus={handleChangeStatus}
        onStartChat={handleStartChat}
      />

      {/* MODAL NOVA VAGA */}
      <JobFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Vaga"
        formData={newJobData}
        setFormData={setNewJobData}
        onSubmit={handleCreateJob}
        isSubmitting={isSubmitting}
        submitText="Publicar Vaga"
      />

      {/* MODAL EDITAR VAGA */}
      <JobFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Vaga"
        formData={editJobData}
        setFormData={setEditJobData}
        onSubmit={handleUpdateJob}
        isSubmitting={isSubmitting}
        submitText="Salvar Alterações"
      />
    </div>
  );
}
