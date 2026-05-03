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
  FiEdit,
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
  role: string;
  course?: string;
  institution?: string;
  skills?: string[];
  bio?: string;
  links?: UserLink[];
  projects?: UserProject[];
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

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("connectu_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
  }, []);

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
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`http://localhost:3333/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  if (!user) return null;

  const mockJobs = [
    {
      id: 1,
      title: "Estágio em Frontend (React)",
      match: 85,
      type: "Híbrido",
      tech: "React, Next.js",
    },
    {
      id: 2,
      title: "Desenvolvedor Backend Jr",
      match: 40,
      type: "Remoto",
      tech: "Node.js, Prisma",
    },
    
  ]

  return (
    <div className="mx auto max-w-5xl-pb-12">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className={`h-32 w-full bg-linear-to-r ${user.role === "RECRUITER" ? "from-purple-900 to-zinc-900" :  "from-blue-900 to-zinc-800"}`}></div>

        <div className="relative px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-6">
              <div className={`relative -top-12 flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-zinc-900 text-3xl font-bold text-white shadow-2xl ${user.role === "RECRUITER" ? "bg-zinc-800" : "bg-blue-600"}`}>
                {user.name.charAt(0)}
                {user.role === "RECRUITER" && (
                  <div className="absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-purple-600 text-white" title="Conta Verificada"> 
                  <FiZap size={14} />
                  </div>
                )}
              </div>

              <div className="-mt-10 mb-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {user.name}
                </h1>
                <p className="mt-1 flex items-center gap-2 font-medium text-zinc-400">
                  {user.role === "STUDENT" ? (
                    `${user.course} na ${user.institution}`
                  ) : (
                    <span className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-sm border border-purple-500/20">
                      <FiBriefcase size={14} /> Equipe de Talentos
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 md:mb-2">
              <button className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 hover:border-zinc-600 backdrop-blur-sm">
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
              <button onClick={openBioModal} className="text-zinc-400 hover:text-white transition-colors">
                <FiEdit2 />
              </button>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-all">
              {user.bio ? (
                user.bio
              ) : (
                <span className="italic">
                  {user.role === "STUDENT" ? "Nenhum resumo adicionado." : "Adicione a missão e cultura da sua empresa."}
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
                  <div className="flex justify-between text-xs text-zinc-500 mb-1
                  font-medium">
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
              <button onClick={openLinkModal} className="text-blue-500 hover:text-blue-400">
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
                  href={link.url.startsWith("http") ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 transition-colors hover:border-blue-500 hover:text-blue-400">
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
          {/* {user.role === "STUDENT"? (
            
          )} */}
        </div>
      </div>
    </div>
  );
}
