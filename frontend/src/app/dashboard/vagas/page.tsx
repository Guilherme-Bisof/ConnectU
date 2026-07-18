"use client";

import { useEffect, useState } from "react";
import { FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { calculateMatch, MatchResult } from "@/utils/matchAlgorithm";
import { StudentFullJobModal } from "@/app/components/jobs/StudentFullJobModal";
import { CourseSuggestionsModal } from "@/app/components/jobs/CourseSuggestionsModal";

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

// ─── Cores dinâmicas do badge de match ─────────────────────────────────────
function getMatchBadgeStyle(score: number) {
  if (score >= 80)
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60)
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function getScoreStrokeColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

// ─── Sub-componente: Card de Vaga na Lista ─────────────────────────────────
function JobListCard({
  job,
  matchScore,
  userSkills,
  isSelected,
  onClick,
}: {
  job: {
    id: string;
    title: string;
    type: string;
    companyName: string;
    location: string;
    requiredSkills: string[];
    transparencyScore: number;
  };
  matchScore: number;
  userSkills: string[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const userNorm = userSkills.map(normalize);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl p-5 cursor-pointer group transition-all border ${
        isSelected
          ? "bg-[#316cf4]/5 border-[#316cf4]/40 shadow-[0_0_15px_rgba(49,108,244,0.08)]"
          : "bg-[#131313] border-[#2a2d32] hover:bg-[#1c1b1b]"
      }`}
    >
      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-[#316cf4] rounded-r-full" />
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0 ${
              isSelected
                ? "bg-[#316cf4] text-white border-[#316cf4]"
                : "bg-[#393939] text-white border-[#434655]"
            }`}
          >
            {job.companyName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white group-hover:text-[#316cf4] transition-colors truncate max-w-[220px]">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500">
              {job.companyName} • {job.location}
            </p>
          </div>
        </div>

        <div
          className={`px-2 py-1 border rounded-md flex items-center shrink-0 ml-2 ${getMatchBadgeStyle(matchScore)}`}
        >
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {matchScore}% Match
          </span>
        </div>
      </div>

      {/* Tags de Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.requiredSkills.slice(0, 3).map((skill, i) => {
          const hasIt = userNorm.includes(normalize(skill));
          return (
            <span
              key={i}
              className={`px-2.5 py-1 rounded text-xs font-medium border ${
                hasIt
                  ? "bg-[#2a2a2a] border-[#434655] text-white"
                  : "bg-[#2a2a2a] border-red-900/40 text-red-400"
              }`}
            >
              {hasIt ? skill : `Falta ${skill}`}
            </span>
          );
        })}
        {job.requiredSkills.length > 3 && (
          <span className="px-2.5 py-1 bg-[#2a2a2a] border border-[#434655] rounded text-xs text-gray-400">
            +{job.requiredSkills.length - 3}
          </span>
        )}
      </div>

      {/* Métricas de rodapé */}
      <div className="flex items-center gap-4 border-t border-[#434655]/50 pt-3 text-gray-500 text-xs">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Transparência: {job.transparencyScore}/100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Média: 14 dias</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente: Painel de Detalhes ────────────────────────────────────
function JobDetailPanel({
  job,
  matchResult,
  animatedScore,
  onOpenDetails,
  onOpenCourses,
}: {
  job: {
    id: string;
    title: string;
    type: string;
    companyName: string;
    location: string;
    salaryRange: string;
    transparencyScore: number;
    description?: string;
  };
  matchResult: MatchResult;
  animatedScore: number;
  onOpenDetails: () => void;
  onOpenCourses: () => void;
}) {


  const dashArray = (animatedScore / 100) * 100;

  const allMatched = [
    ...matchResult.matchedRequired,
    ...matchResult.matchedDesirable,
  ];
  const allMissing = [
    ...matchResult.missingRequired,
    ...matchResult.missingDesirable,
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto p-8 flex flex-col gap-8">
      {/* Detail Header */}
      <div className="flex items-start justify-between bg-[#131313] border border-[#434655] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-16 h-16 rounded-xl bg-[#316cf4] flex items-center justify-center text-white text-3xl font-bold shadow-inner shrink-0">
            {job.companyName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                {job.companyName}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                {job.type}
              </span>
            </div>
          </div>
        </div>

        {/* Match Circle */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0 ml-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#353534]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={`${getScoreStrokeColor(matchResult.score)} transition-all duration-1000 ease-out`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${dashArray}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-base font-bold text-white leading-tight">
              {animatedScore}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              Match
            </span>
          </div>
        </div>
      </div>

      {/* Layout Split for details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Match Analysis */}
        <div className="flex flex-col gap-6">
          {/* Skills Atendidas */}
          <section>
            <h3 className="font-semibold text-white mb-4">
              Por que você recebeu esse match?
            </h3>
            {allMatched.length === 0 ? (
              <p className="text-sm italic text-gray-500">
                Nenhuma competência em comum encontrada.
              </p>
            ) : (
              <div className="space-y-3">
                {allMatched.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-[#131313] border border-emerald-500/30 rounded-xl p-4 flex gap-4 items-start"
                  >
                    <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-white">{skill}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Requisito da vaga atendido.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Skills Faltantes */}
          <section>
            <h3 className="font-semibold text-white mb-4">
              O que falta para 100%?
            </h3>
            {allMissing.length === 0 ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-emerald-400">
                  Você possui todas as skills listadas!
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {allMissing.map((skill, i) => {
                  const isRequired = matchResult.missingRequired.includes(skill);
                  return (
                    <div
                      key={i}
                      className={`bg-[#131313] border rounded-xl p-4 flex gap-4 items-start ${
                        isRequired
                          ? "border-red-500/30"
                          : "border-amber-500/30"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 shrink-0 mt-0.5 ${isRequired ? "text-red-400" : "text-amber-400"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-white">{skill}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRequired
                            ? "Obrigatório para a vaga"
                            : "Desejável (Diferencial) pela empresa"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Dica Card */}
          <section className="bg-[#1E1B16] border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-amber-500/10 rotate-12">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h4 className="font-semibold">Dica para melhorar seu perfil</h4>
              </div>
              <p className="text-sm text-gray-400 mb-4 pr-8">
                Manter seu portfólio atualizado com projetos reais aumenta
                significativamente suas chances de ser notado por recrutadores.
              </p>
              <button
                onClick={onOpenCourses}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                Ver sugestões de cursos
              </button>
            </div>
          </section>
        </div>

        {/* Right: Job Info */}
        <div className="flex flex-col gap-6">
          {/* Sobre a vaga */}
          <section>
            <h3 className="font-semibold text-white mb-4">Sobre a vaga</h3>
            <div className="bg-[#131313] border border-[#434655] rounded-xl p-1">
              <dl className="flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-[#434655]/50">
                  <dt className="text-sm text-gray-500">Nível</dt>
                  <dd className="font-semibold text-white">Júnior/Pleno</dd>
                </div>
                <div className="flex items-center justify-between p-3 border-b border-[#434655]/50">
                  <dt className="text-sm text-gray-500">Modelo</dt>
                  <dd className="font-semibold text-white">{job.location}</dd>
                </div>
                <div className="flex items-center justify-between p-3">
                  <dt className="text-sm text-gray-500">Regime</dt>
                  <dd className="font-semibold text-white">{job.type}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Benefícios */}
          <section>
            <h3 className="font-semibold text-white mb-4">Benefícios</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <svg className="w-5 h-5 text-[#316cf4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Vale Alimentação / Refeição
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <svg className="w-5 h-5 text-[#316cf4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Plano de Saúde e Odonto
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <svg className="w-5 h-5 text-[#316cf4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Auxílio Home Office
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Bottom Metrics & CTA */}
      <div className="mt-4 border-t border-[#434655] pt-8">
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs text-gray-500">Faixa salarial</span>
            <span className="font-semibold text-emerald-400">
              {job.salaryRange}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-center border-x border-[#434655]">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Transparência
            </span>
            <span className="font-semibold text-white">
              {job.transparencyScore}/100
            </span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Tempo médio
            </span>
            <span className="font-semibold text-white">14 dias</span>
          </div>
        </div>
        <button
          onClick={onOpenDetails}
          className="w-full py-4 bg-[#316cf4] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(49,108,244,0.3)]"
        >
          Ver detalhes completos da vaga
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function VagasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<MatchedJobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"recommended" | "saved">("recommended");
  const [searchQuery, setSearchQuery] = useState("");

  const [animatedScore, setAnimatedScore] = useState(0);

  const isProfileIncomplete =
    user?.role === "STUDENT" &&
    (!user.course?.trim() ||
      !user.institution?.trim() ||
      !user.endDate?.trim() ||
      !user.skills ||
      user.skills.length === 0);

  // Carrega o usuário
  useEffect(() => {
    const storedUser = localStorage.getItem("connectu_user");
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Busca os Matches no Backend
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

  // ─── Enriquecimento dos dados ────────────────────────────────────────────
  const enrichedJobs = matchedJobs.map((job) => {
    const mocks = getMockData(job.id);
    const matchRes = calculateMatch(
      user?.skills || [],
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

  // Animação do score quando muda a seleção
  useEffect(() => {
    const resetTimer = setTimeout(() => setAnimatedScore(0), 0);
    let animTimer: NodeJS.Timeout;

    if (selectedJobId) {
      const selJob = enrichedJobs.find((j) => j.originalId === selectedJobId);
      if (selJob) {
        animTimer = setTimeout(() => {
          setAnimatedScore(selJob.matchResult.score);
        }, 100);
      }
    }

    return () => {
      clearTimeout(resetTimer);
      if (animTimer) clearTimeout(animTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, matchedJobs]);

  // Candidatura
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



  // Filtro de busca
  const filteredJobs = enrichedJobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.enrichedData.title.toLowerCase().includes(q) ||
      j.enrichedData.companyName.toLowerCase().includes(q) ||
      j.enrichedData.requiredSkills.some((s) =>
        s.toLowerCase().includes(q),
      )
    );
  });

  const selectedData = enrichedJobs.find((j) => j.originalId === selectedJobId);

  // ─── Loading & Guards ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2a2d32] border-t-[#316cf4] mb-3" />
        Carregando o motor de inteligência...
      </div>
    );
  }

  if (!user || user.role !== "STUDENT") {
    return (
      <div className="p-8 text-center text-gray-400">
        Esta página é exclusiva para alunos encontrarem suas vagas ideais.
      </div>
    );
  }

  if (isProfileIncomplete) {
    return (
      <div className="mx-auto max-w-5xl pb-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-[#131313] border border-[#2a2d32] rounded-2xl p-12 max-w-xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center text-2xl mb-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <FiLock />
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base max-w-md mb-8">
            Para visualizarmos as vagas ideais e calcularmos a sua
            compatibilidade com as empresas, precisamos conhecer você um pouco
            melhor.
          </p>
          <button
            onClick={() => router.push("/dashboard/perfil?redirected=true")}
            className="border border-[#2a2d32] bg-[#181a1d] text-[#316cf4] hover:bg-[#2a2d32] font-semibold px-8 py-2.5 rounded-lg text-sm transition-all shadow-md"
          >
            Completar perfil
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="px-8 py-6 border-b border-[#434655] shrink-0 bg-[#0d0f11]/95 backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
          Vagas &amp; Match
        </h2>
        <p className="text-sm text-gray-400">
          Vagas recomendadas com base no seu perfil e objetivos,{" "}
          {user.name.split(" ")[0]}.
        </p>
      </header>

      {/* Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Search, Filters & List */}
        <div className="w-[40%] min-w-[360px] border-r border-[#434655] flex flex-col bg-[#0e0e0e]">
          {/* Tabs */}
          <div className="flex border-b border-[#434655] px-6 shrink-0">
            <button
              onClick={() => setActiveTab("recommended")}
              className={`px-4 py-4 font-bold transition-colors ${
                activeTab === "recommended"
                  ? "text-white border-b-2 border-[#316cf4] bg-[#316cf4]/5"
                  : "text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
              }`}
            >
              Para Você
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-4 font-bold transition-colors ${
                activeTab === "saved"
                  ? "text-white border-b-2 border-[#316cf4] bg-[#316cf4]/5"
                  : "text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
              }`}
            >
              Vagas Salvas
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-6 border-b border-[#434655] shrink-0 flex flex-col gap-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <input
                className="w-full bg-[#131313] text-white border border-[#434655] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] outline-none transition-all placeholder:text-gray-600"
                placeholder="Pesquisar vagas, empresas ou competências"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-[#131313] border border-[#434655] rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors text-xs">
                Modalidade
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-[#131313] border border-[#434655] rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors text-xs">
                Nível
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              <div className="h-6 w-px bg-[#434655] mx-1" />
              <button className="px-3 py-1.5 bg-[#316cf4]/10 border border-[#316cf4]/30 text-[#316cf4] rounded-lg text-xs hover:bg-[#316cf4]/20 transition-colors">
                Remoto
              </button>
              <button className="px-3 py-1.5 bg-[#131313] border border-[#434655] text-gray-400 rounded-lg text-xs hover:bg-[#2a2a2a] transition-colors">
                CLT
              </button>
            </div>

            {/* Count & sort */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {filteredJobs.length} vagas encontradas
              </span>
              <button className="flex items-center gap-1 text-gray-500 hover:text-white text-xs transition-colors">
                Maior Match
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Job List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            {activeTab === "recommended" ? (
              filteredJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#434655] p-8 text-center text-gray-500 text-sm">
                  {searchQuery.trim()
                    ? "Nenhuma vaga encontrada para essa busca."
                    : "Nenhuma vaga encontrada no momento."}
                </div>
              ) : (
                filteredJobs.map((jobObj) => (
                  <JobListCard
                    key={jobObj.originalId}
                    job={jobObj.enrichedData}
                    matchScore={jobObj.matchResult.score}

                    userSkills={user.skills || []}
                    isSelected={selectedJobId === jobObj.originalId}
                    onClick={() => setSelectedJobId(jobObj.originalId)}
                  />
                ))
              )
            ) : (
              <div className="rounded-xl border border-dashed border-[#434655] p-8 text-center text-gray-500 text-sm">
                Você ainda não salvou nenhuma vaga.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Job Details */}
        <div className="flex-1 bg-[#0d0f11] overflow-y-auto custom-scrollbar flex justify-center pb-12">
          {selectedData ? (
            <JobDetailPanel
              job={selectedData.enrichedData}
              matchResult={selectedData.matchResult}
              animatedScore={animatedScore}
              onOpenDetails={() => setIsModalOpen(true)}
              onOpenCourses={() => setIsCoursesModalOpen(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <h3 className="text-lg font-bold text-gray-400">
                  Nenhuma vaga selecionada
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Selecione uma vaga na lista ao lado para ver a análise de
                  compatibilidade.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
              (app: { userId: string }) => app.userId === user?.id,
            ) || appliedJobIds.includes(selectedData.originalId)
          }
        />
      )}

      {selectedData && (
        <CourseSuggestionsModal
          isOpen={isCoursesModalOpen}
          onClose={() => setIsCoursesModalOpen(false)}
          missingSkills={[
            ...selectedData.matchResult.missingRequired,
            ...selectedData.matchResult.missingDesirable,
          ]}
        />
      )}
    </div>
  );
}
