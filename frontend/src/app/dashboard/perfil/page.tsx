"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiTarget,
  FiCalendar,
  FiMapPin,
  FiEdit3,
  FiCheckCircle,
  FiCircle,
  FiPlusCircle,
  FiArrowRight,
  FiAward,
  FiShield,
  FiCpu,
  FiLock,
  FiSettings,
  FiGlobe,
  FiLinkedin,
  FiGithub,
  FiExternalLink,
  FiX,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { EditBioModal } from "@/app/components/profile/EditBioModal";
import { EditSkillModal } from "@/app/components/profile/EditSkillsModal";
import { EditLinkModal } from "@/app/components/profile/EditLinkModal";
import { EditProjectModal } from "@/app/components/profile/EditProjectModal";
import { EditBasicProfileModal } from "@/app/components/profile/EditBasicModal";
import { EditJobModal } from "@/app/components/profile/EditJobModal";
import { ViewJobModal } from "@/app/components/profile/ViewJobModal";

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
  bannerUrl?: string;
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
  location?: string;
}

interface JobData {
  id: string;
  title: string;
  type: string;
  desirableSkills?: string[];
  description?: string;
  requiredSkills: string[];
  isActive: boolean;
  isInternship: boolean;
}


function getProfileCompletion(user: UserData): number {
  let total = 5; // name, course, institution, bio, avatarUrl
  let filled = 0;

  if (user.name) filled++;
  if (user.course) filled++;
  if (user.institution) filled++;
  if (user.bio) filled++;
  if (user.avatarUrl) filled++;

  total += 3; // +3 para skills, projetos, links
  if (user.skills && user.skills.length > 0) filled++;
  if (user.projects && user.projects.length > 0) filled++;
  if (user.links && user.links.length > 0) filled++;

  return Math.round((filled / total) * 100);
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
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Especificos para Alunos
  const [editCourse, setEditCourse] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editDegreeType, setEditDegreeType] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editResumeUrl, setEditResumeUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [editLocation, setEditLocation] = useState("");

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
  const [jobFormData, setJobFormData] = useState({
    title: "",
    type: "Tempo Integral",
    description: "",
    skillsInput: "",
    desirableSkillsInput: "",
    isInternship: false,
  });
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Estado para guardar as vagas (recrutador ou empresa)
  const [companyJobs, setCompanyJobs] = useState<JobData[]>([]);



  // Estados modal visualizar/gerenciar vaga
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isViewJobModalOpen, setIsViewJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Estados para controlar quais vagas estão expandidas (Ver mais/ Ver menos)
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  // Estado para exibir barra de perfil concluído
  const [showCompleteMsg, setShowCompleteMsg] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{title: string; description: string} | null>(null);

  useEffect(() => {
    if (!user) return;
    const completionKey = `profileCompletionSeen:${user.id}`;
    const completion = getProfileCompletion(user);

    if (completion < 100) {
      localStorage.removeItem(completionKey);
      setTimeout(() => setShowCompleteMsg(false), 0);
    } else if (completion === 100 && !localStorage.getItem(completionKey)) {
      setTimeout(() => setShowCompleteMsg(true), 0);
    }
  }, [user]);

  useEffect(() => {
    if (user && getProfileCompletion(user) === 100 && showCompleteMsg) {
      const completionKey = `profileCompletionSeen:${user.id}`;
      const timer = setTimeout(() => {
        setShowCompleteMsg(false);
        localStorage.setItem(completionKey, "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, showCompleteMsg]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("connectu_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);

        try {
          const res = await fetch(
            `https://connectu-gd1z.onrender.com/users/${parsedUser.id}`,
          );
          if (res.ok) {
            const freshUser = await res.json();
            // Mantém a localização do cache caso a API antiga na nuvem não a possua
            if (freshUser.location === undefined) {
              freshUser.location = parsedUser.location;
            }
            setUser(freshUser);
            localStorage.setItem("connectu_user", JSON.stringify(freshUser));

            // Verifica se na URL possui a indicação de redirecionamento da trava
            const params = new URLSearchParams(window.location.search);
            if (params.get("redirected") === "true") {
              setEditName(freshUser.name || "");
              setEditAvatarUrl(freshUser.avatarUrl || "");
              setEditBannerUrl(freshUser.bannerUrl || "");
              setEditCourse(freshUser.course || "");
              setEditInstitution(freshUser.institution || "");
              setEditDegreeType(freshUser.degreeType || "");
              setEditStartDate(freshUser.startDate || "");
              setEditEndDate(freshUser.endDate || "");
              setEditResumeUrl(freshUser.resumeUrl || "");
              setEditLocation(freshUser.location || "");
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
            `https://connectu-gd1z.onrender.com/jobs/company/${user.companyId}`,
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
            `https://connectu-gd1z.onrender.com/jobs/match/${user.id}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            await res.json();
          }
        } catch (error) {
          console.error("Erro ao buscar vagas recomendadas:", error);
        }
      }
    }

    fetchDashboardData();
  }, [user]);

  // FUNÇÕES DO MODAL DE SKILLS 
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
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            skills: tempSkills,
          }),
        },
      );

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

  //  FUNÇÕES DO MODAL DE SOBRE (BIO) 
  function openBioModal() {
    setBioInput(user?.bio || "");
    setIsBioModalOpen(true);
  }

  async function handleSaveBio() {
    if (!user) return;
    setIsSavingBio(true);

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bio: bioInput }),
        },
      );

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
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ links: tempLinks }),
        },
      );
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
      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projects: tempProjects }),
        },
      );
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

  async function handleSaveJob() {
    if (!user) return;
    setIsSubmittingJob(true);

    const requiredSkills = jobFormData.skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    const desirableSkills = jobFormData.desirableSkillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    try {
      const isEditing = editingJobId !== null;
      const url = isEditing
        ? `https://connectu-gd1z.onrender.com/jobs/${editingJobId}`
        : "https://connectu-gd1z.onrender.com/jobs";
      const method = isEditing ? "PUT" : "POST";

      const token = localStorage.getItem("connectu_token");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: jobFormData.title,
          type: jobFormData.type,
          description: jobFormData.description,
          requiredSkills,
          desirableSkills,
          isInternship: jobFormData.isInternship,
          companyId: user.companyId || user.id,
        }),
      });

      if (response.ok) {
        const savedJob = await response.json();

        if (isEditing) {
          setCompanyJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === editingJobId ? savedJob : job)),
          );
          if (selectedJob && selectedJob.id === editingJobId) {
            setSelectedJob(savedJob);
          }
          alert("Vaga atualizada com sucesso!");
        } else {
          setCompanyJobs((prevJobs) => [savedJob, ...prevJobs]);
          alert("Vaga criada com sucesso!");
        }

        setIsJobModalOpen(false);
        setEditingJobId(null);
      } else {
        const errorData = await response.json();
        alert(`Erro do servidor: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Erro de rede ao salvar vaga:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setIsSubmittingJob(false);
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
      const response = await fetch(
        `https://connectu-gd1z.onrender.com/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok || response.status === 204) {
        setCompanyJobs((prevJobs) =>
          prevJobs.filter((job) => job.id !== jobId),
        );
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

        if (response.ok) {
          const updatedJob = await response.json();
          setCompanyJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === jobId ? updatedJob : job)),
          );
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
    setJobFormData({
      title: job.title,
      type: job.type,
      description: job.description || "",
      skillsInput: job.requiredSkills.join(", "),
      desirableSkillsInput: job.desirableSkills?.join(", ") || "",
      isInternship: job.isInternship || false,
    });
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
    setEditBannerUrl(user?.bannerUrl || "");
    setEditCourse(user?.course || "");
    setEditInstitution(user?.institution || "");
    setEditDegreeType(user?.degreeType || "");
    setEditStartDate(user?.startDate || "");
    setEditEndDate(user?.endDate || "");
    setEditResumeUrl(user?.resumeUrl || "");
    setEditLocation(user?.location || "");
    setIsEditProfileModalOpen(true);
  }

  async function handleSaveBasicProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem("connectu_token");
      let finalResumeUrl = editResumeUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        try {
          await fetch(
            `https://connectu-gd1z.onrender.com/users/${user.id}/avatar`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            },
          );
        } catch (uploadError) {
          console.error("Erro no upload da imagem:", uploadError);
          alert(
            "Aviso: Os dados serão salvos, mas houve um erro ao enviar a foto.",
          );
        }
      }

      if (resumeFile) {
        const resumeData = new FormData();
        resumeData.append("file", resumeFile);
        const uploadRes = await fetch(
          `https://connectu-gd1z.onrender.com/users/${user.id}/resume`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: resumeData,
          },
        );
        const data = await uploadRes.json();
        finalResumeUrl = data.resumeUrl;
      }

      if (bannerFile) {
        const bannerData = new FormData();
        bannerData.append("file", bannerFile);
        try {
          await fetch(
            `https://connectu-gd1z.onrender.com/users/${user.id}/banner`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: bannerData,
            },
          );
        } catch (error) {
          console.error("Erro no upload do banner:", error);
        }
      }

      const res = await fetch(
        `https://connectu-gd1z.onrender.com/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName,
            course: editCourse,
            institution: editInstitution,
            degreeType: editDegreeType,
            startDate: editStartDate,
            endDate: editEndDate,
            resumeUrl: finalResumeUrl,
            location: editLocation,
          }),
        },
      );

      if (res.ok) {
        const updatedUser = await res.json();
        // Preservar location caso o backend na nuvem ignore este campo
        if (updatedUser.location === undefined) {
          updatedUser.location = editLocation;
        }
        setUser(updatedUser);
        localStorage.setItem("connectu_user", JSON.stringify(updatedUser));
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

  const completionPercent = getProfileCompletion(user);

  // Fallbacks de imagens
  const bannerSrc = user.bannerUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop";

  // Elementos do checklist de completude do perfil
  const hasBasicProfile = !!(user.name && user.course && user.institution);
  const hasSkills = !!(user.skills && user.skills.length > 0);
  const hasProjects = !!(user.projects && user.projects.length > 0);

  // Conquistas com base nas regras dinâmicas
  const badgeCount = (hasBasicProfile ? 1 : 0) + (user.isPioneer ? 1 : 0) + ((user.skills && user.skills.length >= 5) ? 1 : 0) + (hasProjects ? 1 : 0);

  return (
    <div className="-m-6 flex flex-col min-h-screen">
      {/* Toast de Perfil Completo */}
      {user && getProfileCompletion(user) === 100 && showCompleteMsg && (
        <div className="fixed top-20 right-8 z-50 rounded-lg border border-emerald-500/20 bg-[#1e2024] px-4 py-3 text-sm text-emerald-400 font-semibold shadow-2xl animate-fadeIn flex justify-between items-center gap-4">
          <span>Perfil completo! Suas vagas foram liberadas. 🎉</span>
          <button
            onClick={() => {
              setShowCompleteMsg(false);
              localStorage.setItem(`profileCompletionSeen:${user.id}`, "true");
            }}
            className="text-emerald-500 hover:text-emerald-400 p-1 rounded transition-colors"
            title="Fechar aviso"
          >
            <FiX className="text-lg" />
          </button>
        </div>
      )}

      {/* Toast Personalizado (Em breve) */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 w-80 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-5 shadow-2xl z-50 animate-fadeIn"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-zinc-100">{toastMsg.title}</h3>
            <button onClick={() => setToastMsg(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            {toastMsg.description}
          </p>
          <div className="inline-flex w-fit items-center gap-1.5 text-[9px] font-semibold text-blue-400/70 uppercase tracking-wider bg-blue-500/5 py-1 px-2 rounded-md border border-blue-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60"></span>
            Disponível em breve
          </div>
        </div>
      )}

      {/* Aviso de perfil incompleto (Bloqueio) para aluno */}
      {user?.role === "STUDENT" && getProfileCompletion(user) < 100 && (() => {
        const missingFields = [];
        if (!user.course?.trim()) missingFields.push("Curso");
        if (!user.institution?.trim()) missingFields.push("Instituição");
        if (!user.endDate?.trim()) missingFields.push("Previsão de Conclusão");
        if (!user.skills || user.skills.length === 0) missingFields.push("Habilidades/Skills");

        if (missingFields.length > 0) {
          return (
            <div className="mb-4 mx-8 mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-md animate-fadeIn">
              <p className="font-medium">
                Para liberar o seu painel de vagas, preencha:{" "}
                <span className="font-bold underline">{missingFields.join(", ")}</span>.
              </p>
              <button
                onClick={openEditProfileModal}
                className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded border border-amber-500/30 transition-colors uppercase"
              >
                Preencher agora
              </button>
            </div>
          );
        }
        return null;
      })()}

      <main className="flex-1 flex flex-col items-center">
        {/* Center Column Constraint */}
        <div className="w-full max-w-5xl mx-auto">
          {/* Premium Hero Area */}
          <div className="relative w-full">
            {/* Hero Banner */}
            <div className="h-80 w-full overflow-hidden relative rounded-b-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-full object-cover brightness-[0.6]"
                src={bannerSrc}
                alt="Banner do Perfil"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#111317] via-transparent to-transparent"></div>
            </div>

            {/* Profile Info Overlap */}
            <div className="px-6 md:px-8 -mt-20 relative z-10 flex flex-col md:flex-row items-end gap-6">
              {/* Large Overlapping Photo */}
              <div className="relative shrink-0">
                <div className="w-44 h-44 rounded-full border-8 border-[#111317] p-1 bg-[#111317] shadow-xl overflow-hidden flex items-center justify-center">
                  {user.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      className="w-full h-full rounded-full object-cover shadow-inner"
                      src={user.avatarUrl}
                      alt={user.name}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center text-4xl font-bold text-white uppercase">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                {user.isPioneer && (
                  <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#316cf4] border-4 border-[#111317] flex items-center justify-center shadow-lg" title="Membro Fundador">
                    <MdVerified className="text-white text-lg" />
                  </div>
                )}
              </div>

              {/* Text Header Content */}
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight wrap-break-word">
                    {user.name}
                  </h2>
                  {user.isPioneer && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black text-[10px] tracking-widest uppercase shrink-0">
                      PIONEIRO
                    </span>
                  )}
                </div>

                <p className="text-[#316cf4] font-semibold text-lg md:text-xl mb-2 leading-snug">
                  {user.role === "STUDENT"
                    ? `${user.course || "Aluno"} na ${user.institution || "Instituição de Ensino"}`
                    : "Recrutador Corporativo"}
                </p>

                {user.role === "STUDENT" && (
                  <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                    {user.startDate && user.endDate && (
                      <span className="flex items-center gap-1">
                        <FiCalendar className="text-lg" />
                        {user.startDate} até {user.endDate}
                      </span>
                    )}
                    <span className="opacity-30">•</span>
                    <span className="flex items-center gap-1">
                      <FiMapPin className="text-lg" />
                      {user.location || "Maringá, PR"}
                    </span>
                  </div>
                )}
              </div>

              {/* Primary Action */}
              <div className="pb-6 w-full md:w-auto">
                <button
                  onClick={openEditProfileModal}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#282a2e] border border-[#2a2d32] text-white font-semibold hover:bg-[#333539] transition-all whitespace-nowrap shadow-lg text-sm"
                >
                  <FiEdit3 className="text-lg" />
                  <span>Editar Perfil</span>
                </button>
              </div>
            </div>
          </div>

          {/* Two Column Grid Layout */}
          <div className="grid grid-cols-12 gap-6 px-6 md:px-8 mt-8 pb-12">
            {/* Left Column (Support Modules) */}
            <aside className="col-span-12 md:col-span-4 space-y-6">
              {/* Profile Completion (Professional Focused) */}
              {user.role === "STUDENT" && (
                completionPercent < 100 ? (
                  <section className="bg-[#1e2024] p-6 rounded-xl border border-[#2a2d32] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-white">Completar Perfil</h3>
                      <span className="text-[#316cf4] font-bold text-lg">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-[#333539] h-2 rounded-full mb-6 overflow-hidden">
                      <div
                        className="bg-[#316cf4] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(49,108,244,0.5)]"
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between text-gray-400">
                        <div className="flex items-center gap-2">
                          {user.bio ? (
                            <FiCheckCircle className="text-[#316cf4] text-lg shrink-0" />
                          ) : (
                            <FiCircle className="text-gray-600 text-lg shrink-0" />
                          )}
                          <span className={`text-sm ${user.bio ? "text-gray-300" : ""}`}>Biografia acadêmica</span>
                        </div>
                        {!user.bio && <span className="text-[#316cf4] font-semibold text-xs">+25%</span>}
                      </li>
                      <li className="flex items-center justify-between text-gray-400">
                        <div className="flex items-center gap-2">
                          {hasSkills ? (
                            <FiCheckCircle className="text-[#316cf4] text-lg shrink-0" />
                          ) : (
                            <FiCircle className="text-gray-600 text-lg shrink-0" />
                          )}
                          <span className={`text-sm ${hasSkills ? "text-gray-300" : ""}`}>Competências técnicas</span>
                        </div>
                        {!hasSkills && <span className="text-[#316cf4] font-semibold text-xs">+25%</span>}
                      </li>
                      <li className="flex items-center justify-between text-gray-400">
                        <div className="flex items-center gap-2">
                          {hasProjects ? (
                            <FiCheckCircle className="text-[#316cf4] text-lg shrink-0" />
                          ) : (
                            <FiCircle className="text-gray-600 text-lg shrink-0" />
                          )}
                          <span className={`text-sm ${hasProjects ? "text-gray-300" : ""}`}>Vitrine de projetos</span>
                        </div>
                        {!hasProjects && <span className="text-[#316cf4] font-semibold text-xs">+25%</span>}
                      </li>
                    </ul>
                    <button
                      onClick={openProjectModal}
                      className="w-full mt-6 py-2.5 border border-[#316cf4]/30 text-[#316cf4] rounded-lg font-bold hover:bg-[#316cf4]/5 transition-all text-xs uppercase"
                    >
                      {hasProjects ? "Adicionar Outro Projeto" : "Adicionar Projeto"}
                    </button>
                  </section>
                ) : (
                  <section className="bg-[#1e2024] p-6 rounded-xl border border-[#2a2d32] shadow-sm">
                    <h3 className="font-bold text-lg text-white mb-2">Próximos passos</h3>
                    <p className="text-sm text-gray-400 mb-6">Seu perfil está pronto. Explore vagas compatíveis com suas competências.</p>
                    <Link
                      href="/dashboard/explorar"
                      className="w-full flex items-center justify-center py-2.5 bg-[#316cf4] hover:bg-[#2556cc] text-white rounded-lg font-bold transition-all text-sm mb-4"
                    >
                      EXPLORAR VAGAS
                    </Link>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setToastMsg({
                            title: "Disponibilidade profissional",
                            description: "Essa configuração estará disponível em breve.",
                          })
                        }
                        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-gray-400 hover:bg-[#2a2d32] hover:text-white transition-colors gap-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FiCalendar className="text-lg text-[#316cf4]/80 shrink-0" />
                          <span className="truncate text-left leading-snug">Atualizar disponibilidade</span>
                        </span>
                        <span className="rounded-full bg-[#316cf4]/10 px-2 py-0.5 text-xs text-[#316cf4] shrink-0 whitespace-nowrap font-medium">
                          Em breve
                        </span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() =>
                          setToastMsg({
                            title: "Preferências de vaga",
                            description: "Em breve você poderá personalizar cargos, modalidades e localizações de interesse.",
                          })
                        }
                        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-gray-400 hover:bg-[#2a2d32] hover:text-white transition-colors gap-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 text-[#316cf4]/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span className="truncate text-left leading-snug">Revisar preferências</span>
                        </span>
                        <span className="rounded-full bg-[#316cf4]/10 px-2 py-0.5 text-xs text-[#316cf4] shrink-0 whitespace-nowrap font-medium">
                          Em breve
                        </span>
                      </button>
                    </div>
                  </section>
                )
              )}

              {/* Conquistas (Badges Module) */}
              <section className="bg-[#1e2024] p-6 rounded-xl border border-[#2a2d32] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-white">Conquistas</h3>
                  <span className="text-xs font-semibold text-gray-500">{badgeCount} / 12</span>
                </div>
                {(() => {
                  const achievements = [
                    {
                      id: "verified",
                      name: "Perfil verificado",
                      icon: FiShield,
                      unlocked: hasBasicProfile,
                      className: "border-blue-500/40 bg-blue-500/10 text-blue-400",
                    },
                    {
                      id: "pioneer",
                      name: "Pioneiro ConnectU",
                      icon: FiAward,
                      unlocked: !!user.isPioneer,
                      className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
                    },
                    {
                      id: "match",
                      name: "Primeiro Match",
                      icon: FiTarget,
                      unlocked: (user.skills && user.skills.length >= 5),
                      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                    },
                    {
                      id: "innovation",
                      name: "Projeto inovador",
                      icon: FiCpu,
                      unlocked: hasProjects,
                      className: "border-violet-500/40 bg-violet-500/10 text-violet-400",
                    },
                  ];
                  return (
                    <div className="grid grid-cols-4 gap-3">
                      {achievements.map((achievement) => {
                        const Icon = achievement.unlocked
                          ? achievement.icon
                          : FiLock;

                        return (
                          <button
                            key={achievement.id}
                            type="button"
                            title={
                              achievement.unlocked
                                ? achievement.name
                                : "Conquista bloqueada"
                            }
                            aria-label={
                              achievement.unlocked
                                ? achievement.name
                                : "Conquista bloqueada"
                            }
                            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${achievement.unlocked
                                ? achievement.className
                                : "border-zinc-800 bg-zinc-900/60 text-zinc-700"
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                      {[...Array(8)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          title="Conquista bloqueada"
                          aria-label="Conquista bloqueada"
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-700 opacity-30 cursor-not-allowed"
                        >
                          <FiLock className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </section>

              {/* Official Links */}
              <section className="bg-[#1e2024] p-6 rounded-xl border border-[#2a2d32] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-white">Links Profissionais</h3>
                  <button
                    onClick={openLinkModal}
                    type="button"
                    title="Configurar links profissionais"
                    aria-label="Configurar links profissionais"
                    className="text-zinc-500 transition-colors hover:text-blue-400"
                  >
                    <FiSettings className="h-4 w-4" />
                  </button>
                </div>
                {(() => {
                  function getLinkIcon(label: string) {
                    const cleanLabel = label.toLowerCase();
                    if (cleanLabel.includes("linkedin")) return FiLinkedin;
                    if (cleanLabel.includes("github")) return FiGithub;
                    return FiGlobe;
                  }
                  return (
                    <div className="space-y-2">
                      {user.links && user.links.length > 0 ? (
                        user.links.map((link) => {
                          const Icon = getLinkIcon(link.label);
                          return (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-3 text-sm text-zinc-300 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-white"
                            >
                              <span className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-zinc-500" />
                                {link.label}
                              </span>

                              <FiExternalLink className="h-3.5 w-3.5 text-zinc-600" />
                            </a>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-600 italic py-2">
                          Nenhum link adicionado. Clique na engrenagem ao lado para gerenciar.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </section>
            </aside>

            {/* Right Column (Main Content) */}
            <div className="col-span-12 md:col-span-8 space-y-6">
              {/* Sobre Mim */}
              <section className="bg-[#1e2024] p-6 md:p-8 rounded-xl border border-[#2a2d32] relative shadow-sm">
                <button
                  onClick={openBioModal}
                  type="button"
                  aria-label="Editar sobre mim"
                  title="Editar sobre mim"
                  className="absolute top-6 right-6 text-zinc-500 transition-colors hover:text-blue-400"
                >
                  <FiEdit3 className="h-4 w-4" />
                </button>
                <h3 className="font-bold text-lg text-white mb-3">Sobre Mim</h3>
                <p className="text-gray-400 leading-relaxed text-base whitespace-pre-wrap">
                  {user.bio || "Escreva uma breve apresentação sobre sua carreira acadêmica e profissional."}
                </p>
              </section>

              {/* Competências (Skills) */}
              {user.role === "STUDENT" && (
                <section className="bg-[#1e2024] p-6 md:p-8 rounded-xl border border-[#2a2d32] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">Hard Skills</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Habilidades validadas que impulsionam o seu Match nas vagas do ConnectU.
                      </p>
                    </div>
                    <button
                      onClick={openSkillModal}
                      className="p-2 bg-[#316cf4]/10 text-[#316cf4] rounded-full hover:bg-[#316cf4]/20 transition-colors"
                    >
                      <FiPlus className="text-[20px]" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-lg bg-[#316cf4] text-white font-semibold text-xs shadow-[0_4px_12px_rgba(49,108,244,0.3)]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 italic py-2">
                        Nenhuma competência adicionada. Clique no botão de mais para incluir suas hard skills.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Seção Exclusiva de Vagas (Recrutador) */}
              {user.role === "RECRUITER" && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-900/10 p-6 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FiTarget className="text-purple-400" /> Oportunidades Abertas
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Gerencie suas vagas e encontre os melhores talentos.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingJobId(null);
                        setJobFormData({
                          title: "",
                          type: "Tempo Integral",
                          description: "",
                          skillsInput: "",
                          desirableSkillsInput: "",
                          isInternship: false,
                        });
                        setIsJobModalOpen(true);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700"
                    >
                      <FiPlus /> Criar Vaga
                    </button>
                  </div>

                  <div className="space-y-4">
                    {companyJobs.length === 0 ? (
                      <div className="bg-[#1e2024] border border-[#2a2d32] rounded-xl p-8 text-center text-gray-500">
                        Nenhuma vaga publicada ainda.
                      </div>
                    ) : (
                      companyJobs.map((job) => (
                        <div
                          key={job.id}
                          className="group relative flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-[#2a2d32] bg-[#1e2024]/40 p-5 hover:border-purple-500/40 hover:bg-[#1e2024] transition-all"
                        >
                          <div className="mb-4 md:mb-0 max-w-2xl flex-1 pr-4">
                            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                              {job.title}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300 border border-zinc-700">
                                {job.type}
                              </span>
                              {job.isInternship && (
                                <span className="rounded bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                                  Estágio
                                </span>
                              )}
                              {job.requiredSkills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300 border border-zinc-700"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.desirableSkills?.map((skill, i) => (
                                <span
                                  key={`des-${i}`}
                                  className="rounded bg-purple-950/30 px-2.5 py-0.5 text-xs text-purple-300 border border-purple-900/30"
                                  title="Desejável (Plus)"
                                >
                                  +{skill}
                                </span>
                              ))}
                            </div>

                            {job.description && (
                              <div className="mt-3">
                                <p className={`text-sm text-gray-400 transition-all ${expandedJobIds.includes(job.id) ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                                  {job.description}
                                </p>
                                <button
                                  onClick={() => toggleJobDescription(job.id)}
                                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 mt-1 transition-colors"
                                >
                                  {expandedJobIds.includes(job.id) ? "Ver menos" : "Ver mais"}
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsViewJobModalOpen(true);
                            }}
                            className="rounded-lg bg-white hover:bg-gray-200 px-4 py-2 text-xs font-bold text-black transition-all"
                          >
                            Ver Vaga
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {/* Vitrine de Projetos re-posicionada */}
              {user.role === "STUDENT" && (
                <section>
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Vitrine de Projetos
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        Projetos que demonstram suas competências na prática.
                      </p>
                    </div>
                    <button
                      onClick={openProjectModal}
                      className="flex items-center gap-2 text-sm font-bold text-[#316cf4] hover:text-[#316cf4]/80 transition-colors"
                    >
                      <FiPlusCircle className="h-5 w-5" />
                      Novo projeto
                    </button>
                  </div>

                  {!user.projects || user.projects.length === 0 ? (
                    <div className="bg-[#1e2024] border border-dashed border-[#2a2d32] rounded-xl p-8 text-center text-gray-500 text-sm">
                      Nenhum projeto cadastrado na sua vitrine.
                    </div>
                  ) : (
                    <div
                      className={`grid gap-4 ${user.projects!.length === 1
                          ? "grid-cols-1"
                          : "grid-cols-1 md:grid-cols-2"
                        }`}
                    >
                      {user.projects!.map((proj, idx) => {
                        const isSingle = user.projects!.length === 1;

                        if (isSingle) {
                          return (
                            <div
                              key={idx}
                              className="grid overflow-hidden rounded-xl border border-[#2a2d32] bg-[#1e2024] md:grid-cols-[42%_1fr] shadow-sm hover:border-[#316cf4]/40 transition-all duration-500 group"
                            >
                              <div className="relative h-48 md:h-full min-h-48">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1740&auto=format&fit=crop"
                                  alt={proj.title}
                                  className="h-full w-full object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent md:bg-linear-to-t md:from-transparent"></div>
                              </div>
                              <div className="flex flex-col p-5 justify-between">
                                <div>
                                  <h3 className="line-clamp-2 text-base font-bold text-white mb-2">
                                    {proj.title}
                                  </h3>
                                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400 mb-4 whitespace-pre-wrap">
                                    {proj.description}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-[#2a2d32] pt-4 mt-auto">
                                  {proj.link ? (
                                    <a
                                      href={proj.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[#316cf4] font-bold text-xs hover:underline group/link"
                                    >
                                      <span>Ver projeto</span>
                                      <FiArrowRight className="text-[14px] transition-transform group-hover/link:translate-x-1" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-zinc-500 italic">Em desenvolvimento</span>
                                  )}
                                  <button onClick={openProjectModal} className="text-gray-500 hover:text-white transition-colors" title="Editar Projeto">
                                    <FiEdit3 className="text-[18px]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2a2d32] bg-[#1e2024] shadow-sm hover:border-[#316cf4]/40 transition-all duration-500 group"
                          >
                            <div className="relative overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1740&auto=format&fit=crop"
                                alt={proj.title}
                                className="aspect-video w-full object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                            <div className="flex flex-1 flex-col p-4 justify-between">
                              <div>
                                <h3 className="line-clamp-2 text-base font-bold text-white mb-2">
                                  {proj.title}
                                </h3>
                                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400 mb-4 whitespace-pre-wrap">
                                  {proj.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between border-t border-[#2a2d32] pt-3 mt-auto">
                                {proj.link ? (
                                  <a
                                    href={proj.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[#316cf4] font-bold text-xs hover:underline group/link"
                                  >
                                    <span>Ver projeto</span>
                                    <FiArrowRight className="text-[14px] transition-transform group-hover/link:translate-x-1" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-zinc-500 italic">Em desenvolvimento</span>
                                )}
                                <button onClick={openProjectModal} className="text-gray-500 hover:text-white transition-colors" title="Editar Projeto">
                                  <FiEdit3 className="text-[18px]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

            </div>
          </div>



        </div>
      </main>

      {/* Modais existentes conectados à lógica da página */}
      <EditSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        tempSkills={tempSkills}
        onAddSkill={handleAddTempSkill}
        onRemoveSkill={handleRemoveTempSkill}
        onSave={handleSaveSkills}
        isSaving={isSaving}
      />

      <EditBioModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        bioInput={bioInput}
        setBioInput={setBioInput}
        onSave={handleSaveBio}
        isSaving={isSavingBio}
      />

      <EditLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        linkLabel={linkLabel}
        setLinkLabel={setLinkLabel}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        tempLinks={tempLinks}
        onAddLink={handleAddTempLink}
        onRemoveLink={handleRemoveTempLink}
        onSave={handleSaveLinks}
        isSaving={isSavingLinks}
      />

      <EditProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        projectDesc={projectDesc}
        setProjectDesc={setProjectDesc}
        projectLink={projectLink}
        setProjectLink={setProjectLink}
        tempProjects={tempProjects}
        onAddProject={handleAddTempProject}
        onRemoveProject={handleRemoveTempProject}
        onSave={handleSaveProjects}
        isSaving={isSavingProjects}
      />

      <EditJobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        jobFormData={jobFormData}
        setJobFormData={setJobFormData}
        onSave={handleSaveJob}
        isSubmitting={isSubmittingJob}
        editingJobId={editingJobId}
      />

      <ViewJobModal
        isOpen={isViewJobModalOpen}
        onClose={() => setIsViewJobModalOpen(false)}
        job={selectedJob}
        onDelete={handleDeleteJob}
        onToggleStatus={handleToggleJobStatus}
        onEdit={handleEditJob}
      />

      <EditBasicProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        userRole={user?.role}
        editName={editName}
        setEditName={setEditName}
        editAvatarUrl={editAvatarUrl}
        setEditAvatarUrl={setEditAvatarUrl}
        setAvatarFile={setAvatarFile}
        editBannerUrl={editBannerUrl}
        setEditBannerUrl={setEditBannerUrl}
        setBannerFile={setBannerFile}
        editCourse={editCourse}
        setEditCourse={setEditCourse}
        editInstitution={editInstitution}
        setEditInstitution={setEditInstitution}
        editDegreeType={editDegreeType}
        setEditDegreeType={setEditDegreeType}
        editStartDate={editStartDate}
        setEditStartDate={setEditStartDate}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        setResumeFile={setResumeFile}
        onSave={handleSaveBasicProfile}
        isSaving={isSavingProfile}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editResumeUrl={editResumeUrl}
      />
    </div>
  );
}
