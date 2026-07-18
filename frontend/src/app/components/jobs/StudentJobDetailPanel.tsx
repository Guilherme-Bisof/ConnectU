import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiMapPin,
  FiBriefcase,
  FiStar,
  FiClock,
  FiShield,
  FiAward,
} from "react-icons/fi";
import { MatchResult } from "@/utils/matchAlgorithm";

interface JobData {
  id: string;
  title: string;
  type: string;
  requiredSkills: string[];
  desirableSkills?: string[];
  description?: string;
  companyName?: string;
  location?: string;
  salaryRange?: string;
  transparencyScore?: number;
}

interface StudentJobDetailPanelProps {
  job: JobData | null;
  matchResult: MatchResult | null;
  onOpenDetails?: () => void;
  onOpenCourses?: () => void;
}

export function StudentJobDetailPanel({
  job,
  matchResult,
  onOpenDetails,
  onOpenCourses
}: StudentJobDetailPanelProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const resetTimer = setTimeout(() => setAnimatedScore(0), 0);

    let animTimer: NodeJS.Timeout;
    if (matchResult) {
      animTimer = setTimeout(() => {
        setAnimatedScore(matchResult.score);
      }, 100);
    }

    return () => {
      clearTimeout(resetTimer);
      if (animTimer) clearTimeout(animTimer);
    };
  }, [matchResult?.score, job?.id]);

  if (!job || !matchResult) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#121214] p-12 text-center">
        <div>
          <FiBriefcase className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-bold text-zinc-400">
            Nenhuma vaga selecionada
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            Selecione uma vaga na lista ao lado para ver a análise de
            compatibilidade.
          </p>
        </div>
      </div>
    );
  }

  // Cálculos matemáticos da animação SVG
  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset =
    circleCircumference - (animatedScore / 100) * circleCircumference;

  // Cor dinâmica do círculo de acordo com a nota
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div
      key={job.id}
      className="animate-slideInRight flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] shadow-2xl"
    >
      {/* Header Painel */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 p-8 pb-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-900/20">
            {(job.companyName || "E").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white line-clamp-2 leading-tight">
              {job.title}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">
                {job.companyName || "Empresa Confidencial"}
              </span>
              <span className="flex items-center gap-1">
                <FiMapPin /> {job.location || "São Paulo, SP"}
              </span>
              <span className="flex items-center gap-1">
                <FiBriefcase /> {job.type}
              </span>
            </div>
          </div>
        </div>

        {/* Circulo do match */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="48"
              cy="48"
              r={circleRadius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-zinc-800"
            />
            <circle
              cx="48"
              cy="48"
              r={circleRadius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className={`${getScoreColor(matchResult.score)} transition-all duration-1000 ease-in-out`}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">
              {animatedScore}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Match
            </span>
          </div>
        </div>
      </div>

      {/* Corpo do painel */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Coluna Esquerda */}
          <div className="space-y-8 lg:col-span-3">
            {/* Oque você tem (verde) */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-zinc-300">
                Por que você recebeu esse match?
              </h3>
              <div className="space-y-3">
                {[
                  ...matchResult.matchedRequired,
                  ...matchResult.matchedDesirable,
                ].length === 0 ? (
                  <p className="text-sm italic text-zinc-500">
                    Nenhuma competência em comum encontrada.
                  </p>
                ) : (
                  [
                    ...matchResult.matchedRequired,
                    ...matchResult.matchedDesirable,
                  ].map((skill, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <FiCheckCircle className="mt-0.5 shrink-0 text-lg text-emerald-500" />
                      <div>
                        <p className="font-bold text-zinc-200">{skill}</p>
                        <p className="text-xs text-zinc-500">
                          Requisito da vaga atendido.
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* O que falta (amarelo) */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-zinc-300">
                O que falta para 100%?
              </h3>
              <div className="space-y-3">
                {[
                  ...matchResult.missingRequired,
                  ...matchResult.missingDesirable,
                ].length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    <FiStar /> Você possui todas as skills listadas!
                  </div>
                ) : (
                  [
                    ...matchResult.missingRequired,
                    ...matchResult.missingDesirable,
                  ].map((skill, i) => {
                    const isRequired =
                      matchResult.missingRequired.includes(skill);
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <FiAlertTriangle
                          className={`mt-0.5 shrink-0 text-lg ${isRequired ? "text-red-400" : "text-amber-500"}`}
                        />
                        <div>
                          <p className="font-bold text-zinc-200">{skill}</p>
                          <p className="text-xs text-zinc-500">
                            {isRequired
                              ? "Obrigatório para a vaga"
                              : "Desejável (Diferencial) pela empresa"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Caixa de Dica da IA */}
            <div className="rounded-xl border border-blue-900/30 bg-blue-900/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-400">
                <FiStar /> Dica para melhorar seu match
              </div>
              <p className="text-sm text-zinc-300">
                Adicionar experiência com as competências ausentes pode aumentar
                suas chances significativamente.
              </p>
              <button 
              onClick={onOpenCourses}
              className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700">
                Ver sugestões de cursos
              </button>
            </div>
          </div>

          {/* Coluna Direita (MOCKS) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Sobre a Vaga */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-zinc-300">
                Sobre a vaga
              </h3>
              <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nível</span>
                  <span className="font-medium text-zinc-200">
                    Júnior/Pleno
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Modelo</span>
                  <span className="font-medium text-zinc-200">{job.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Regime</span>
                  <span className="font-medium text-zinc-200">CLT</span>
                </div>
              </div>
            </div>

            {/* Benefícios */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-zinc-300">
                Benefícios
              </h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <FiAward className="text-purple-400" />
                  Vale Alimentação / Refeição
                </div>
                <div className="flex items-center gap-2">
                  <FiAward className="text-purple-400" /> Plano de Saúde e
                  Odonto
                </div>
                <div className="flex items-center gap-2">
                  <FiAward className="text-purple-400" /> Auxílio Home Office
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER  */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800/50 bg-zinc-900/50 p-6 shrink-0">
        <div className="px-4 text-center">
          <p className="mb-1 text-xs font-bold text-zinc-500">Faixa salarial</p>
          <p className="text-sm font-bold text-emerald-400">
            {job.salaryRange || "R$ 3.500 - R$ 4.500"}
          </p>
        </div>
        <div className="px-4 text-center">
          <p className="mb-1 flex items-center justify-center gap-1 text-xs font-bold text-zinc-500">
            <FiShield /> Transparência
          </p>
          <p className="text-sm font-bold text-zinc-200">
            {job.transparencyScore || 92}/100
          </p>
        </div>
        <div className="px-4 text-center">
          <p className="mb-1 flex items-center justify-center gap-1 text-xs font-bold text-zinc-500">
            <FiClock /> Tempo médio
          </p>
          <p className="text-sm font-bold text-zinc-200">14 dias</p>
        </div>
      </div>
      <div className="border-t border-zinc-800/50 bg-[#121214] p-6 shrink-0">
        <button onClick={onOpenDetails} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 shadow-lg shadow-blue-900/20">
          Ver detalhes completos da vaga &rarr;
        </button>
      </div>
    </div>
  );
}
