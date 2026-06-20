import { FiMapPin, FiBriefcase, FiClock } from "react-icons/fi";

interface JobData {
  id: string;
  title: string;
  type: string;
  requiredSkills: string[];
  desirableSkills?: string[];
  companyName?: string;
  location?: string;
  salaryRange?: string;
  transparencyScore?: number;
}

interface StudentJobCardProps {
  job: JobData;
  matchScore: number;
  isSelected: boolean;
  onClick: () => void;
}

export function StudentJobCard({
  job,
  matchScore,
  isSelected,
  onClick,
}: StudentJobCardProps) {
  // Definir cores do match (verde alto, amarelo médio, vermelho baixo)
  const getMatchColor = (score: number) => {
    if (score >= 80)
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60)
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
        isSelected
          ? "bg-blue-900/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          : "bg-[#121214] border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {/* Indicador lateral de seleção */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
      )}

      {/* Cabecalho card */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-1 gap-4 min-w-0">
          {/* mock de logo da empresa */}
          <div
            className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-xl font-bold border transition-colors ${
              isSelected
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 group-hover:bg-zinc-700"
            }`}
          >
            {(job.companyName || "E").charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>{job.companyName || "Empresa Confidencial"}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span>{job.location || "Remoto"}</span>
            </p>
          </div>
        </div>

        {/* Pilula de Match */}
        <div
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${getMatchColor(matchScore)}`}
        >
          <span>{matchScore}% match</span>
        </div>
      </div>

      {/* Tags de Skills */}
      <div className="flex flex-wrap gap-2 mt-2">
        {job.requiredSkills.slice(0, 3).map((skill, index) => (
          <span
            key={index}
            className="text-[11px] font-medium bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700/50"
          >
            {skill}
          </span>
        ))}
        {job.requiredSkills.length > 3 && (
          <span className="text-[11px] font-medium bg-zinc-800/50 text-zinc-500 px-2 py-1 rounded-md">
            +{job.requiredSkills.length - 3}
          </span>
        )}
      </div>

      {/* Rodapé com métricas fake */}
      <div className="flex items-center gap-4 mt-2 pt-4 border-t border-zinc-800/50 text-[11px] font-semibold text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-500/80">
          <FiBriefcase /> Transparência: {job.transparencyScore || 92}/100
        </div>
        <div className="flex items-center gap-1.5">
          <FiClock /> Média: 14 dias
        </div>
      </div>
    </div>
  );
}
