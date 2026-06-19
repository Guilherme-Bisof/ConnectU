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
  FiTrash2,
} from "react-icons/fi";

import { StudentProfileModal } from "@/app/components/jobs/StudentProfileModal";
import { JobFormModal } from "@/app/components/jobs/JobFormModal";
import { JobCard } from "@/app/components/jobs/JobCard";

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
            isInternship: newJobData.isInternship,
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
          vagas.map((vaga) => (
            <JobCard
              key={vaga.id}
              vaga={vaga}
              isExpanded={expandedJobId === vaga.id}
              onToggleExpand={toggleExpandJob}
              onToggleStatus={handleToggleStatus}
              onEdit={openEditModal}
              onDelete={handleExcluir}
              onSelectStudent={setSelectedStudent}
              onRemoveApplicant={handleRemoveApplicant}
            />
          ))
        )}
      </div>

      {/* MODAL: PERFIL RESUMIDO DO ALUNO */}
      <StudentProfileModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />

      {/* MODAL DE NOVA VAGA */}
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

      {/* MODAL DE EDITAR VAGA */}
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
