"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBookOpen,
  FiMapPin,
  FiBriefcase,
  FiLink,
  FiGithub,
  FiLinkedin,
  FiExternalLink,
  FiUser,
  FiYoutube,
  FiGlobe,
  FiX,
  FiCalendar,
  FiZap,
  FiAward,
} from "react-icons/fi";

interface UserLink {
  id: string;
  label: string;
  url: string;
}

interface UserProject {
  id: string;
  title: string;
  description: string;
  link?: string;
}

interface PublicProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  course?: string;
  institution?: string;
  degreeType?: string;
  startDate?: string;
  endDate?: string;
  resumeUrl?: string;
  isPioneer?: boolean;
  bio?: string;
  skills?: string[];
  links?: UserLink[];
  projects?: UserProject[];
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Novo estado para o Modal de Projetos
  const [selectedProject, setSelectedProject] = useState<UserProject | null>(
    null,
  );

  useEffect(() => {
    async function fetchProfile() {
      if (!id) return;

      try {
        const res = await fetch(
          `http://localhost:3333/users/${id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          console.error("Perfil não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        Carregando perfil do candidato...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">
          Perfil não encontrado
        </h2>
        <p className="text-zinc-400 mb-6">
          O candidato que você está procurando não existe ou foi removido.
        </p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Voltar para Vagas
        </button>
      </div>
    );
  }

  // Função super robusta para identificar o ícone (checa o Título e a URL em minúsculo)
  const getLinkIcon = (label: string, url: string) => {
    const searchStr = `${label} ${url}`.toLowerCase();

    if (searchStr.includes("github")) return <FiGithub className="text-lg" />;
    if (searchStr.includes("linkedin"))
      return <FiLinkedin className="text-lg" />;
    if (searchStr.includes("youtube")) return <FiYoutube className="text-lg" />;
    if (searchStr.includes("site") || searchStr.includes("port"))
      return <FiGlobe className="text-lg" />;

    return <FiLink className="text-lg" />;
  };

  return (
    <div className="mx-auto max-w-4xl pb-12 animate-fadeIn relative">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <FiArrowLeft /> Voltar para Minhas Vagas
      </button>

      {/* Header do Perfil */}
      <div className="relative mb-8 rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-r from-blue-900/40 to-purple-900/40 border-b border-zinc-800/50"></div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-12">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center text-4xl sm:text-5xl font-black text-blue-500 shadow-2xl">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`Foto de ${profile.name}`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              profile.name.charAt(0)
            )}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {profile.name}
              </h1>
              {profile.isPioneer && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 px-3 py-1 shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md"
                  title="Membro Fundador ConnectU"
                >
                  <FiAward className="text-amber-400" size={14} />
                  <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                    Pioneiro
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 justify-center sm:justify-start">
              <p className="text-blue-400 flex items-center gap-2 font-medium">
                <FiUser /> Candidato(a)
              </p>

              {/*Botão do currículo */}
              {profile.resumeUrl && (
                <>
                  <span className="hidden sm:block text-zinc-700"></span>
                  <a
                    href={
                      profile.resumeUrl.startsWith("http")
                        ? profile.resumeUrl
                        : `https://${profile.resumeUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <FiExternalLink /> Ver Currículo
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Links Rápidos no Header */}
          {profile.links && profile.links.length > 0 && (
            <div className="flex gap-3 mt-4 sm:mt-0">
              {profile.links.map((link) => (
                <a
                  key={link.id}
                  href={
                    link.url.startsWith("http")
                      ? link.url
                      : `https://${link.url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 hover:bg-blue-600 hover:text-white transition-all border border-zinc-700 hover:border-blue-500"
                  title={link.label}
                >
                  {getLinkIcon(link.label, link.url)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna da Esquerda (Informações Básicas e Skills) */}
        <div className="space-y-6 md:col-span-1">
          {/* Formação */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
              Formação
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiBookOpen className="text-blue-400 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm text-zinc-400">
                    Curso {profile.degreeType ? `(${profile.degreeType})` : ""}
                  </p>
                  <p className="text-white font-medium">
                    {profile.course || "Não informado"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="text-purple-400 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm text-zinc-400">Instituição</p>
                  <p className="text-white font-medium">
                    {profile.institution || "Não informada"}
                  </p>
                </div>
              </div>

              {(profile.startDate || profile.endDate) && (
                <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/50 mt-2">
                  <FiCalendar
                    className="text-emerald-400 mt-1 shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-sm text-zinc-400">Período Acadêmico</p>
                    <p className="text-white font-medium">
                      {profile.startDate || "?"} até{" "}
                      {profile.endDate || "Atual"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Competências (Skills) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
              Competências Técnicas
            </h3>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">
                Nenhuma competência listada.
              </p>
            )}
          </div>
        </div>

        {/* Coluna da Direita (Bio e Projetos) */}
        <div className="space-y-6 md:col-span-2">
          {/* Resumo Profissional (Bio) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
              Sobre o Profissional
            </h3>

            {profile.bio ? (
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 italic">
                Este candidato ainda não escreveu um resumo sobre si.
              </p>
            )}
          </div>

          {/* Portfólio / Projetos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
              Portfólio & Projetos
            </h3>

            {profile.projects && profile.projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="group bg-zinc-950 border border-zinc-800/60 p-5 rounded-xl hover:border-blue-500/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                        {project.title}
                      </h4>
                      {project.link && (
                        <a
                          href={
                            project.link.startsWith("http")
                              ? project.link
                              : `https://${project.link}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // Impede que o clique no link abra o modal também
                          className="text-zinc-500 hover:text-blue-400 ml-2 shrink-0 p-1 bg-zinc-900 rounded-md"
                          title="Acessar link direto"
                        >
                          <FiExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-3">
                      {project.description}
                    </p>
                    <p className="text-[10px] text-blue-500 font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalhes
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-dashed border-zinc-800 p-8 rounded-xl text-center">
                <FiBriefcase className="mx-auto text-3xl text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500">
                  Nenhum projeto cadastrado no portfólio.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO PROJETO */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="flex items-start justify-between mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white pr-8">
                {selectedProject.title}
              </h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md transition-colors"
              >
                <FiX />
              </button>
            </div>

            {/* Conteúdo do Modal (Rolável se for muito grande) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              {/* Espaço reservado para futura Imagem */}
              {/* <div className="w-full h-48 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-500">
                Área reservada para imagem do projeto
              </div> 
              */}

              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Descrição Completa
                </h3>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.link && (
                <div className="pt-4 border-t border-zinc-800/50">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Link do Projeto
                  </h3>
                  <a
                    href={
                      selectedProject.link.startsWith("http")
                        ? selectedProject.link
                        : `https://${selectedProject.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Acessar Repositório / Site <FiExternalLink />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
