"use client";

import { useEffect, useState } from "react";
import {
  FiGithub,
  FiLinkedin,
  FiLink,
  FiPlus,
  FiEdit2,
  FiX,
  FiYoutube,
  FiGlobe,
  FiExternalLink,
  FiBriefcase,
  FiZap,
  FiTarget,
  FiAward,
} from "react-icons/fi";

interface UserProject {
  id?: string;
  title: string;
  description: string;
  link?: string;
}

interface UserLink {
  id?: string;
  label: string;
  url: string;
}

interface UserData {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  companyId?: string;
  course?: string;
  institution?: string;
  degreeType?: string;
  startDate?: string;
  endDate?: string;
  resumeUrl?: string;
  isPioneer?: boolean;
  skills?: string[];
  bio?: string;
  links?: UserLink[];
  projects?: UserProject[];
}

interface JobData {
  id: string;
  title: string;
  type: string;
  description?: string;
  requiredSkills: string[];
  isActive: boolean;
}

interface MatchedJobData extends JobData {
  matchPercentage: number;
  company: {
    name: string;
  };
}

interface Applicant {
  applicationId: string;
  status: string;
  matchPercentage: number;
  user: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    course?: string;
    institution?: string;
  };
}

function getLinkIcon(label: string) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("github")) return <FiGithub className="text-lg" />;
  if (lowerLabel.includes("linkedin"))
    return <FiLinkedin className="text-lg" />;
  if (lowerLabel.includes("youtube")) return <FiYoutube className="text-lg" />;
  if (lowerLabel.includes("site") || lowerLabel.includes("port"))
    return <FiGlobe className="text-lg" />;
  return <FiLink className="text-lg" />;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);

  // Estados do Modal de Skills
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estados Modal para Editar o perfil (Dados Básicos)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Especificos para Alunos
  const [editCourse, setEditCourse] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editDegreeType, setEditDegreeType] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editResumeUrl, setEditResumeUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados do Modal de Sobre (Bio)
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Estados do modal de links
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tempLinks, setTempLinks] = useState<UserLink[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [tempProjects, setTempProjects] = useState<UserProject[]>([]);
  const [isSavingProjects, setIsSavingProjects] = useState(false);

  // Estados do modal de criação de vagas
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobType, setJobType] = useState("Remoto");
  const [jobDesc, setJobDesc] = useState("");
  const [jobSkillInput, setJobSkillInput] = useState("");
  const [jobSkills, setJobSkills] = useState<string[]>([]);

  // Estado para guardar as vagas (recrutador ou empresa)
  const [companyJobs, setCompanyJobs] = useState<JobData[]>([]);

  // Estado para guardar match com vagas (Usuário)
  const [matchedJobs, setMatchedJobs] = useState<MatchedJobData[]>([]);

  // Estados modal visualizar/gerenciar vaga
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isViewJobModalOpen, setIsViewJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Estados para controlar quais vagas estão expandidas (Ver mais/ Ver menos)
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("connectu_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);

        try {
          const res = await fetch(
            `http://localhost:3333/users/${parsedUser.id}`,
          );
          if (res.ok) {
            const freshUser = await res.json();
            setUser(freshUser);
            localStorage.setItem("connectu_user", JSON.stringify(freshUser));

            // Verifica se na URL possui a indicação de redirecionamento da trava
            const params = new URLSearchParams(window.location.search);
            if (params.get("redirected") === "true") {
              setEditName(freshUser.name || "");
              setEditAvatarUrl(freshUser.avatarUrl || "");
              setEditCourse(freshUser.course || "");
              setEditInstitution(freshUser.institution || "");
              setEditDegreeType(freshUser.degreeType || "");
              setEditStartDate(freshUser.startDate || "");
              setEditEndDate(freshUser.endDate || "");
              setEditResumeUrl(freshUser.resumeUrl || "");
              setIsEditProfileModalOpen(true);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados atualizados do usuário.", error);
        }
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      if (user.role === "RECRUITER" && user.companyId) {
        // Busca as vagas que a empresa criou
        try {
          const token = localStorage.getItem("connectu_token");
          const res = await fetch(
            `http://localhost:3333/jobs/company/${user.companyId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setCompanyJobs(data);
          }
        } catch (error) {
          console.error("Erro ao buscar vagas da empresa:", error);
        }
      } else if (user.role === "STUDENT") {
        // Busca as vagas com Match para o aluno
        try {
          const token = localStorage.getItem("connectu_token");
          const res = await fetch(
            `http://localhost:3333/jobs/match/${user.id}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setMatchedJobs(data);
          }
        } catch (error) {
          console.error("Erro ao buscar vagas recomendadas:", error);
        }
      }
    }

    fetchDashboardData();
  }, [user]);

  // --- FUNÇÕES DO MODAL DE SKILLS ---
  function openSkillModal() {
    setTempSkills(user?.skills || []);
    setIsSkillModalOpen(true);
  }

  function handleAddTempSkill(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !tempSkills.includes(skill)) {
      setTempSkills([...tempSkills, skill]);
    }
    setSkillInput("");
  }

  function handleRemoveTempSkill(skillToRemove: string) {
    setTempSkills(tempSkills.filter((s) => s !== skillToRemove));
  }

  async function handleSaveSkills() {
    if (!user) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skills: tempSkills,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));
        setIsSkillModalOpen(false);
      } else {
        alert("Erro ao salvar competências.");
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // --- FUNÇÕES DO MODAL DE SOBRE (BIO) ---
  function openBioModal() {
    setBioInput(user?.bio || "");
    setIsBioModalOpen(true);
  }

  async function handleSaveBio() {
    if (!user) return;
    setIsSavingBio(true);

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: bioInput }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));
        setIsBioModalOpen(false);
      } else {
        alert("Erro ao salvar resumo.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsSavingBio(false);
    }
  }

  // Funções dos links
  function openLinkModal() {
    const currentLinks =
      user?.links?.map((l) => ({ label: l.label, url: l.url })) || [];
    setTempLinks(currentLinks);
    setIsLinkModalOpen(true);
  }

  function handleAddTempLink(e: React.FormEvent) {
    e.preventDefault();
    if (linkLabel.trim() && linkUrl.trim()) {
      setTempLinks([
        ...tempLinks,
        { label: linkLabel.trim(), url: linkUrl.trim() },
      ]);
      setLinkLabel("");
      setLinkUrl("");
    }
  }

  function handleRemoveTempLink(indexToRemove: number) {
    setTempLinks(tempLinks.filter((_, index) => index !== indexToRemove));
  }

  async function handleSaveLinks() {
    if (!user) return;
    setIsSavingLinks(true);
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: tempLinks }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));
        setIsLinkModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingLinks(false);
    }
  }

  // Funções Projetos
  function openProjectModal() {
    const currentProjects =
      user?.projects?.map((p) => ({
        title: p.title,
        description: p.description,
        link: p.link,
      })) || [];
    setTempProjects(currentProjects);
    setIsProjectModalOpen(true);
  }

  function handleAddTempProject(e: React.FormEvent) {
    e.preventDefault();
    if (projectTitle.trim() && projectDesc.trim()) {
      setTempProjects([
        ...tempProjects,
        {
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          link: projectLink.trim() || undefined,
        },
      ]);
      setProjectTitle("");
      setProjectDesc("");
      setProjectLink("");
    }
  }

  function handleRemoveTempProject(indexToRemove: number) {
    setTempProjects(tempProjects.filter((_, index) => index !== indexToRemove));
  }

  async function handleSaveProjects() {
    if (!user) return;
    setIsSavingProjects(true);

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projects: tempProjects }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));
        setIsProjectModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingProjects(false);
    }
  }

  function handleAddJobSkill(e: React.FormEvent) {
    e.preventDefault();
    const skill = jobSkillInput.trim();
    if (skill && !jobSkills.includes(skill)) {
      setJobSkills([...jobSkills, skill]);
    }
    setJobSkillInput("");
  }

  function handleRemoveJobSkill(skillToRemove: string) {
    setJobSkills(jobSkills.filter((s) => s !== skillToRemove));
  }

  async function handleSaveJob() {
    if (!user) return;

    try {
      const isEditing = editingJobId !== null;
      const url = isEditing
        ? `http://localhost:3333/jobs/${editingJobId}`
        : "http://localhost:3333/jobs";
      const method = isEditing ? "PUT" : "POST";

      const token = localStorage.getItem("connectu_token");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: jobTitle,
          type: jobType,
          description: jobDesc,
          requiredSkills: jobSkills,
          companyId: user.companyId || user.id,
        }),
      });

      if (response.ok) {
        const savedJob = await response.json();

        if (isEditing) {
          // Se estava a editar, atualiza a vaga no array atual
          setCompanyJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === editingJobId ? savedJob : job)),
          );
          // Atualiza também a vaga selecionada caso o utilizador a abra de novo
          if (selectedJob && selectedJob.id === editingJobId) {
            setSelectedJob(savedJob);
          }
          alert("Vaga atualizada com sucesso!");
        } else {
          // Se estava a criar, adiciona no topo da lista
          setCompanyJobs((prevJobs) => [savedJob, ...prevJobs]);
          alert("Vaga criada com sucesso!");
        }

        // Limpa os campos e reseta o modo de edição
        setJobTitle("");
        setJobType("Remoto");
        setJobDesc("");
        setJobSkills([]);
        setEditingJobId(null);
        setIsJobModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Erro do servidor: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Erro de rede ao salvar vaga:", error);
      alert("Erro ao conectar com o servidor.");
    }
  }

  async function handleDeleteJob(jobId: string) {
    if (
      !confirm(
        "Tem a certeza que deseja excluir esta vaga definitivamente? Esta ação não pode ser desfeita.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("connectu_token");
      const response = await fetch(`http://localhost:3333/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        // 1. Remove a vaga do array para ela sumir do ecrã instantaneamente
        setCompanyJobs((prevJobs) =>
          prevJobs.filter((job) => job.id !== jobId),
        );

        // 2. Fecha o modal de visualização
        setIsViewJobModalOpen(false);

        alert("Vaga apagada com sucesso!");
      } else {
        alert("Erro ao tentar apagar a vaga no servidor.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro de ligação ao servidor.");
    }
  }

  async function handleToggleJobStatus(jobId: string, currentStatus: boolean) {
    const action = currentStatus ? "encerrar" : "reabrir";

    if (confirm(`Deseja realmente ${action} esta vaga?`)) {
      try {
        const token = localStorage.getItem("connectu_token");
        const response = await fetch(
          `http://localhost:3333/jobs/${jobId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: !currentStatus }),
          },
        );

        if (response.ok) {
          const updatedJob = await response.json();

          // Atualiza a vaga na lista geral
          setCompanyJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === jobId ? updatedJob : job)),
          );

          // Atualiza a vaga que está aberta no Modal
          setSelectedJob(updatedJob);
        } else {
          alert("Erro ao atualizar o status da vaga no servidor.");
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
      }
    }
  }

  function handleEditJob(job: JobData) {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobType(job.type);
    setJobDesc(job.description || "");
    setJobSkills(job.requiredSkills);

    setIsViewJobModalOpen(false);
    setIsJobModalOpen(true);
  }

  function toggleJobDescription(jobId: string) {
    setExpandedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
  }

  function openEditProfileModal() {
    setEditName(user?.name || "");
    setEditAvatarUrl(user?.avatarUrl || "");
    setEditCourse(user?.course || "");
    setEditInstitution(user?.institution || "");
    setEditDegreeType(user?.degreeType || "");
    setEditStartDate(user?.startDate || "");
    setEditEndDate(user?.endDate || "");
    setEditResumeUrl(user?.resumeUrl || "");
    setIsEditProfileModalOpen(true);
  }

  async function handleSaveBasicProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem("connectu_token");

      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          avatarUrl: editAvatarUrl,
          course: editCourse,
          institution: editInstitution,
          degreeType: editDegreeType,
          startDate: editStartDate,
          endDate: editEndDate,
          resumeUrl: editResumeUrl,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));

        // Atualizar barra lateral caso tenha mudado o nome
        window.dispatchEvent(new Event("storage"));

        setIsEditProfileModalOpen(false);
      } else {
        alert("Erro ao salvar perfil.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsSavingProfile(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx auto max-w-5xl-pb-12">
      {user?.role === "STUDENT" &&
        (() => {
          const missingFields = [];
          if (!user.course?.trim()) missingFields.push("Curso");
          if (!user.institution?.trim()) missingFields.push("Instituição");
          if (!user.endDate?.trim())
            missingFields.push("Previsão de Conclusão");
          if (!user.skills || user.skills.length === 0)
            missingFields.push("Habilidades/Skills");

          if (missingFields.length > 0) {
            // Exibe a caixinha amarela do seu Mockup 2
            return (
              <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-md animate-fadeIn">
                <p className="font-medium">
                  Para liberar o seu painel de vagas, preencha:{" "}
                  <span className="font-bold underline">
                    {missingFields.join(", ")}
                  </span>
                  .
                </p>
                <button
                  onClick={openEditProfileModal}
                  className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded border border-amber-500/30 transition-colors uppercase"
                >
                  Preencher agora
                </button>
              </div>
            );
          } else {
            // Se preencheu tudo, exibe a caixinha verde do seu Mockup 2
            return (
              <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 font-semibold shadow-md animate-fadeIn">
                Perfil completo! Suas vagas já foram liberadas. 🎉
              </div>
            );
          }
        })()}
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div
          className={`h-32 w-full bg-linear-to-r ${user.role === "RECRUITER" ? "from-purple-900 to-zinc-900" : "from-blue-900 to-zinc-800"}`}
        ></div>

        <div className="relative px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-6">
              <div className="relative -top-12 flex h-28 w-28 shrink-0 items-center justify-center">
                {/* Container da Imagem ou Inicial */}
                <div
                  className={`flex h-full w-full items-center justify-center rounded-2xl border-4 border-zinc-900 text-3xl font-bold text-white shadow-2xl overflow-hidden ${user.role === "RECRUITER" ? "bg-zinc-800" : "bg-blue-600"}`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>

                {/* Badge da Empresa (Fica por fora para não ser cortado pela foto) */}
                {user.role === "RECRUITER" && (
                  <div
                    className="absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-purple-600 text-white z-10"
                    title="Conta Verificada"
                  >
                    <FiZap size={14} />
                  </div>
                )}
              </div>

              <div className="-mt-10 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {user.name}
                </h1>
                {user.isPioneer && (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40  via-yellow-900/40 px-3 py-1 shadow[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md"
                    title="Membro Fundador do ConnectU"
                  >
                    <FiAward className="text-amber-400" size={14} />
                    <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                      Pioneiro
                    </span>
                  </div>
                )}
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 font-medium text-zinc-400">
                  {user.role === "STUDENT" ? (
                    <>
                      <span>
                        {user.degreeType || "Cursando"} em{" "}
                        {user.course || "Não informado"} na{" "}
                        {user.institution || "Não Informada"}{" "}
                      </span>
                      {(user.startDate || user.endDate) && (
                        <span className="hidden sm:block text-zinc-600">•</span>
                      )}
                      {(user.startDate || user.endDate) && (
                        <span className="text-zinc-500 text-sm">
                          {user.startDate || "?"} até {user.endDate || "Atual"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-sm border border-purple-500/20">
                      <FiBriefcase size={14} /> Equipe de Talentos
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-0 md:mb-2">
              <button
                onClick={openEditProfileModal}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 hover:border-zinc-600 backdrop-blur-sm"
              >
                <FiEdit2 /> Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {user.role === "STUDENT" ? "Sobre Mim" : "Nossa Cultura"}
              </h3>
              <button
                onClick={openBioModal}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FiEdit2 />
              </button>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-all">
              {user.bio ? (
                user.bio
              ) : (
                <span className="italic">
                  {user.role === "STUDENT"
                    ? "Nenhum resumo adicionado."
                    : "Adicione a missão e cultura da sua empresa."}
                </span>
              )}
            </p>

            {/* Vibe Check (Apenas Recrutadores) */}
            {user.role === "RECRUITER" && (
              <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1 font-medium">
                    <span>Processo Rígido</span>
                    <span className="text-purple-400">Inovação Ágil</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-zinc-600 to-purple-500 w-[85%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div
                    className="flex justify-between text-xs text-zinc-500 mb-1
                  font-medium"
                  >
                    <span>Trabalho Isolado</span>
                    <span className="text-blue400">Colaborativo</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-zinc-600 to-blue-500 w-[90%] rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/*Links */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Links Oficiais</h3>
              <button
                onClick={openLinkModal}
                className="text-blue-500 hover:text-blue-400"
              >
                <FiPlus />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {!user.links || user.links.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  Nenhum link cadastrado
                </p>
              ) : (
                user.links.map((link, index) => (
                  <a
                    key={index}
                    href={
                      link.url.startsWith("http")
                        ? link.url
                        : `https://${link.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 transition-colors hover:border-blue-500 hover:text-blue-400"
                  >
                    {getLinkIcon(link.label)}
                    <span className="truncate">{link.label}</span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/*Coluna Direita */}
        <div className="md:col-span-2 space-y-6">
          {user.role === "STUDENT" ? (
            // Visão do Aluno
            <>
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Competências (Skills)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Estas habilidades aumentam seu Match com as vagas
                    </p>
                  </div>
                  <button
                    onClick={openSkillModal}
                    className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm font-medium"
                  >
                    <FiPlus /> Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!user.skills || user.skills.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">
                      Nenhuma competência cadastrada ainda.
                    </p>
                  ) : (
                    user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-900/30 border border-blue-800 px-3 py-1 text-sm text-blue-300"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    Vitrine de Projetos
                  </h3>
                  <button
                    onClick={openProjectModal}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    <FiPlus />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!user.projects || user.projects.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic col-span-2">
                      Nenhum projeto cadastrado
                    </p>
                  ) : (
                    user.projects.map((project, index) => (
                      <div
                        key={index}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-blue-500"
                      >
                        <div>
                          <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {project.title}
                          </h4>
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-3">
                            {project.description}
                          </p>
                        </div>
                        {project.link && (
                          <a
                            href={
                              project.link.startsWith("http")
                                ? project.link
                                : `https://${project.link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-400"
                          >
                            Acessar Projeto <FiExternalLink />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            // Visão do Recrutador
            <>
              <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-900/10 p-6 shadow-[0_0_20px_rgba(168,85,247,0.05)] backdrop-blur-md">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiTarget className="text-purple-400" /> Oportunidades
                    Abertas
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Gerencia suas vagas e encontre os melhores talentos
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingJobId(null);
                    setJobTitle("");
                    setJobType("Remoto");
                    setJobDesc("");
                    setJobSkills([]);
                    setIsJobModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-700 hover:shadow[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  <FiPlus /> Criar Vaga
                </button>
              </div>

              {/* Prateleira de Vagas Reais */}
              <div className="space-y-4">
                {companyJobs.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">
                    Nenhuma vaga publicada ainda.
                  </p>
                ) : (
                  companyJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group relative flex flex-col md:flex-row md:items-center justify-between overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 transition-all hover:border-purple-500/50 hover:bg-zinc-800/60 backdrop-blur-md"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                      <div className="relative z-10 mb-4 md:mb-0 max-w-2xl flex-1 pr-4">
                        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-purple-300 transition-colors">
                          {job.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                            {job.type}
                          </span>
                          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                            {job.requiredSkills.join(", ")}
                          </span>
                        </div>

                        {/* Nova Descrição com Ver Mais / Ver Menos */}
                        {job.description && (
                          <div className="mt-3">
                            <p
                              className={`text-sm text-zinc-400 transition-all ${expandedJobIds.includes(job.id) ? "whitespace-pre-wrap" : "line-clamp-2"}`}
                            >
                              {job.description}
                            </p>
                            <button
                              onClick={() => toggleJobDescription(job.id)}
                              className="text-xs font-semibold text-purple-400 hover:text-purple-300 mt-1 transition-colors"
                            >
                              {expandedJobIds.includes(job.id)
                                ? "Ver menos"
                                : "Ver mais"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 flex items-center gap-4">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsViewJobModalOpen(true);
                          }}
                          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-900 transition-all hover:bg-white hover:scale-105"
                        >
                          Ver Vaga
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modais */}
      {/* Modal de Skills */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Editar Competências
              </h2>
              <button
                onClick={() => setIsSkillModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddTempSkill} className="mb-6 flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Ex: React, Figma, Python..."
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Adicionar
              </button>
            </form>
            <div className="mb-8 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tempSkills.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nenhuma competência na lista.
                </p>
              ) : (
                tempSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 rounded-full bg-blue-900/30 border border-blue-800 pl-3 pr-1 py-1 text-sm text-blue-300"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveTempSkill(skill)}
                      className="ml-1 rounded-full p-1 hover:bg-blue-800/50 hover:text-white transition-colors"
                    >
                      <FiX />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsSkillModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSkills}
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bio */}
      {isBioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Editar Resumo</h2>
              <button
                onClick={() => setIsBioModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Escreva um breve resumo..."
              className="w-full h-40 resize-none rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsBioModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingBio ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Links */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Editar Links</h2>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form
              onSubmit={handleAddTempLink}
              className="mb-6 flex flex-col gap-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Título"
                  className="w-1/3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!linkLabel || !linkUrl}
                className="w-full rounded-md bg-zinc-800 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                Adicionar Link
              </button>
            </form>
            <div className="mb-8 flex flex-col gap-2 max-h-40 overflow-y-auto">
              {tempLinks.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum link.</p>
              ) : (
                tempLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400">
                        {getLinkIcon(link.label)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {link.label}
                        </p>
                        <p className="text-xs text-zinc-500 truncate max-w-37.5">
                          {link.url}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTempLink(index)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <FiX />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLinks}
                disabled={isSavingLinks}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Projetos */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Editar Projetos</h2>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form
              onSubmit={handleAddTempProject}
              className="mb-8 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
            >
              <h3 className="text-sm font-semibold text-zinc-300">
                Adicionar Novo
              </h3>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Título"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Descrição..."
                className="w-full h-20 resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="Link (Opcional)"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!projectTitle || !projectDesc}
                className="w-full rounded-md bg-blue-600/20 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600 hover:text-white disabled:opacity-50 mt-2"
              >
                + Inserir na Lista
              </button>
            </form>
            <div className="mb-8 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-300">
                Projetos Atuais
              </h3>
              {tempProjects.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  Nenhum projeto adicionado
                </p>
              ) : (
                tempProjects.map((project, index) => (
                  <div
                    key={index}
                    className="relative rounded-md border border-zinc-800 bg-zinc-950 p-3 pr-10"
                  >
                    <h4 className="text-sm font-bold text-white">
                      {project.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveTempProject(index)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-red-400"
                    >
                      <FiX />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProjects}
                disabled={isSavingProjects}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Modal de Criar Vagas (Exclusivo para recrutadores ou empresas) */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-purple-500/30 bg-zinc-900 p-6 shadow-[0_0_30px_rgba(168,85,247,015)] max-h-[90vh] overflow-auto">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FiTarget className="text-purple-400" />{" "}
                  {editingJobId ? "Editar Oportunidade" : "Nova Oportunidade"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Defina os requisitos para o algoritmo encontrar o talento
                  ideal
                </p>
              </div>
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              {/*Título */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">
                  Título da vaga
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Desenvolvedor Front-end Pleno"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Modelo de Trabalho */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">
                  Modelo de Trabalho
                </label>
                <div className="flex gap-2">
                  {["Remoto", "Híbrido", "Presencial"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setJobType(type)}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-all border ${jobType === type ? "bg-purple-600/20 border-purple-500 text-purple-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/*Descrição */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">
                  Descrição Rápida (Opcional)
                </label>
                <textarea
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Explique sobre a vaga..."
                  className="w-full h-20 resize-none rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Competências Exigidas (Required Skills) */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1 block">
                  Competências Exigidas
                </label>
                <form onSubmit={handleAddJobSkill} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={jobSkillInput}
                    onChange={(e) => setJobSkillInput(e.target.value)}
                    placeholder="Ex: React, Node.js..."
                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                  >
                    Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {jobSkills.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      Nenhuma competência adicionada.
                    </p>
                  ) : (
                    jobSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 rounded-full bg-purple-900/30 border border-purple-800/50 pl-3 pr-1 py-1 text-sm text-purple-300"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveJobSkill(skill)}
                          className="ml-1 rounded-full p-1 hover:bg-purple-800/50 hover:text-white transition-colors"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveJob}
                disabled={!jobTitle || jobSkills.length === 0}
                className="rounded-md bg-purple-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600"
              >
                {editingJobId ? "Guardar Alterações" : "Salvar Vaga"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar/ Gerenciar Vaga */}
      {isViewJobModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* CONTAINER PRINCIPAL: Agora é um flex-col com overflow-hidden */}
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* HEADER: Fixo no topo (shrink-0) */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedJob.title}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${selectedJob.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}
                  >
                    {selectedJob.isActive ? "Aberta" : "Encerrada"}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                    {selectedJob.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsViewJobModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 p-2 rounded-full hover:bg-zinc-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* CORPO: Aqui fica a rolagem independente (overflow-y-auto e flex-1) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Descrição da Vaga
                </h3>
                <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-800">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description ||
                      "Nenhuma descrição detalhada fornecida para esta vaga."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Competências Exigidas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills &&
                  selectedJob.requiredSkills.length > 0 ? (
                    selectedJob.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-purple-900/30 border border-purple-800/50 px-3 py-1 text-sm text-purple-300"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 italic">
                      Nenhuma competência específica listada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER: Fixo na base (shrink-0) */}
            <div className="p-6 pt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                onClick={() => handleDeleteJob(selectedJob.id)}
                className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
              >
                Excluir Vaga
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleToggleJobStatus(selectedJob.id, selectedJob.isActive)
                  }
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${selectedJob.isActive ? "border-yellow-700/50 bg-yellow-900/20 text-yellow-500 hover:bg-yellow-900/40" : "border-emerald-700/50 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40"}`}
                >
                  {selectedJob.isActive ? "Encerrar Vaga" : "Reabrir Vaga"}
                </button>
                <button
                  onClick={() => handleEditJob(selectedJob)}
                  className="flex items-center gap-2 rounded-md bg-purple-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-purple-700"
                >
                  <FiEdit2 size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Perfil Básico */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                Editar Dados Básicos
              </h2>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveBasicProfile} className="space-y-4">
              {/* Campos Universais (Aluno e Empresa) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    URL da Foto de Perfil (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Cole o link de uma imagem (ex: LinkedIn)"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Deixe em branco para usar sua inicial colorida.
                  </p>
                </div>
              </div>

              {/* Campos Específicos para Alunos */}
              {user?.role === "STUDENT" && (
                <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    Dados Acadêmicos
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Curso
                      </label>
                      <input
                        type="text"
                        value={editCourse}
                        onChange={(e) => setEditCourse(e.target.value)}
                        placeholder="Ex: Gestão de TI"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Instituição
                      </label>
                      <input
                        type="text"
                        value={editInstitution}
                        onChange={(e) => setEditInstitution(e.target.value)}
                        placeholder="Ex: FATEC"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Nível de Formação
                      </label>
                      <select
                        value={editDegreeType}
                        onChange={(e) => setEditDegreeType(e.target.value)}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      >
                        <option value="Técnico">Ensino Técnico</option>
                        <option value="Tecnólogo">Tecnólogo</option>
                        <option value="Bacharelado">Bacharelado</option>
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Pós-graduação">
                          Pós-graduação / Especialização
                        </option>
                        <option value="Mestrado">Mestrado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Mês/Ano de Início
                      </label>
                      <input
                        type="text"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        placeholder="Ex: 02/2024"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Previsão de Conclusão
                      </label>
                      <input
                        type="text"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        placeholder="Ex: 12/2026"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-zinc-300 mb-1 block">
                        Link do Currículo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={editResumeUrl}
                        onChange={(e) => setEditResumeUrl(e.target.value)}
                        placeholder="Cole aqui o link do seu PDF (Google Drive, Canva, etc)"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingProfile ? "Salvando..." : "Salvar Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
