"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  projects?: UserProject[];
  links?: UserLink[];
}

interface ProfileStep {
  label: string;
  completed: boolean;
  actionLabel?: string;
  actionHref?: string;
}

interface JobData {
  id: string;
  title: string;
  type: string;
  company?: {
    name: string;
  };
}

interface MatchedJobData extends JobData {
  matchPercentage: number;
}

function getProfileSteps(user: UserData): ProfileStep[] {
  const hasBasicProfile = !!(user.name && user.course && user.institution);
  const hasProject = !!(user.projects && user.projects.length > 0);
  const hasSkills = !!(user.skills && user.skills.length > 0);
  const hasAvatar = !!user.avatarUrl;
  const hasLinks = !!(user.links && user.links.length > 0);

  const steps: ProfileStep[] = [
    {
      label: "Completar perfil básico",
      completed: hasBasicProfile,
      actionHref: "/dashboard/perfil",
    },
    {
      label: "Adicionar um projeto",
      completed: hasProject,
      actionLabel: "Adicionar um projeto",
      actionHref: "/dashboard/perfil",
    },
    {
      label: "Atualizar habilidades",
      completed: hasSkills,
      actionLabel: "Adicionar",
      actionHref: "/dashboard/perfil",
    },
  ];

  if (steps.length < 4 && !hasAvatar) {
    steps.push({
      label: "Adicionar foto de perfil",
      completed: hasAvatar,
      actionLabel: "Adicionar foto",
      actionHref: "/dashboard/perfil",
    });
  }

  if (steps.length < 4 && !hasLinks) {
    steps.push({
      label: "Adicionar links",
      completed: hasLinks,
      actionLabel: "Adicionar link",
      actionHref: "/dashboard/perfil",
    });
  }

  return steps;
}

function getProfileCompletion(user: UserData): number {
  let total = 0;
  let filled = 0;

  // Campos avaliados
  const fields: (keyof UserData)[] = [
    "name",
    "course",
    "institution",
    "bio",
    "avatarUrl",
  ];
  total = fields.length + 3; // +3 para projetos, habilidades e links

  for (const field of fields) {
    if (user[field]) filled++;
  }

  if (user.skills && user.skills.length > 0) filled++;
  if (user.projects && user.projects.length > 0) filled++;
  if (user.links && user.links.length > 0) filled++;

  return Math.round((filled / total) * 100);
}

export default function RightSidebar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [jobs, setJobs] = useState<MatchedJobData[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("connectu_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Seta inicialmente o usuário local
      queueMicrotask(() => setUser(parsedUser));

      // Busca os dados fresquinhos da API do usuário (projetos, links, etc)
      fetch(`https://connectu-gd1z.onrender.com/users/${parsedUser.id}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Falha ao buscar usuário");
        })
        .then((freshUser) => {
          queueMicrotask(() => {
            setUser(freshUser);
            localStorage.setItem("connectu_user", JSON.stringify(freshUser));
          });
        })
        .catch((err) => console.error(err));

      // Busca as vagas
      if (parsedUser.role === "STUDENT") {
        const token = localStorage.getItem("connectu_token");
        fetch(`https://connectu-gd1z.onrender.com/jobs/match/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Falha ao buscar vagas");
          })
          .then((data) => {
            queueMicrotask(() => setJobs(data));
          })
          .catch((err) => console.error(err));
      }
    }
  }, []);

  if (!user) return null;

  const steps = getProfileSteps(user);
  const allStepsComplete = steps.every((s) => s.completed);
  const completionPercent = getProfileCompletion(user);

  // SVG circle math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (completionPercent / 100) * circumference;

  return (
    <aside
      className="w-80 fixed right-0 top-16 bottom-0 overflow-y-auto hidden lg:block border-l border-[#2a2d32] p-6 space-y-6"
      data-purpose="widgets-sidebar"
    >
      {/* Card: Próximos passos — só aparece se o perfil não está completo */}
      {!allStepsComplete && (
        <section
          className="bg-[#181a1d] border border-[#2a2d32] rounded-xl p-5"
          data-purpose="checklist-widget"
        >
          <h4 className="font-bold mb-4 text-white">Próximos passos</h4>
          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    readOnly
                    className="w-4 h-4 rounded border-[#2a2d32] bg-[#0d0f11] text-[#316cf4] focus:ring-[#316cf4] cursor-default"
                  />
                  <span
                    className={`${step.completed ? "text-gray-500 line-through" : "text-gray-300"}`}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.completed && step.actionLabel && step.actionHref && (
                  <Link
                    href={step.actionHref}
                    className="bg-[#316cf4] text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-blue-600 transition-colors whitespace-nowrap ml-2"
                  >
                    {step.actionLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Card: Resumo do perfil */}
      <section
        className="bg-[#181a1d] border border-[#2a2d32] rounded-xl p-5"
        data-purpose="profile-summary-widget"
      >
        <h4 className="font-bold mb-6 text-white">Resumo do perfil</h4>
        <div className="flex items-center justify-around">
          {/* Circular Progress */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-[#2a2d32]"
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
              />
              <circle
                className="text-[#316cf4] transition-all duration-700 ease-out"
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-white">
                {completionPercent}%
              </span>
              <span className="text-[8px] text-gray-500">completo</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Conexões
            </p>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {user.projects?.length || 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Projetos
            </p>
          </div>
        </div>
      </section>

      {/* Card: Vagas recomendadas */}
      <section
        className="bg-[#181a1d] border border-[#2a2d32] rounded-xl p-5"
        data-purpose="jobs-widget"
      >
        <h4 className="font-bold mb-4 text-white">Vagas recomendadas</h4>
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="bg-[#0d0f11]/50 p-3 rounded-lg border border-[#2a2d32]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0">
                    <span className="text-[#0d0f11] font-extrabold text-sm uppercase">
                      {job.company?.name ? job.company.name.charAt(0) : "C"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-white truncate">
                      {job.title}
                    </h5>
                    <p className="text-[10px] text-gray-500 truncate">
                      {job.company?.name || "Empresa confidencial"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/vagas"
                    className="bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors shrink-0"
                  >
                    Ver
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#316cf4] text-xs font-bold">
                    {Math.round(job.matchPercentage || 0)}%
                  </span>
                  <span className="text-[10px] text-gray-500">compatível</span>
                </div>
              </div>
            ))
          ) : user.role === "STUDENT" ? (
            <p className="text-sm text-gray-500 text-center py-2">
              Buscando vagas compatíveis...
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              Disponível apenas para talentos.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
