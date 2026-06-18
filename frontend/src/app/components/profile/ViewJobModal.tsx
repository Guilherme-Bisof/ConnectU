import { FiX, FiEdit2, FiMapPin, FiBriefcase } from "react-icons/fi";

export interface JobData {
  id: string;
  title: string;
  type: string;
  desirableSkills?: string[];
  description?: string;
  requiredSkills: string[];
  isActive: boolean;
  isInternship: boolean;
}

interface ViewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobData | null;
  onDelete: (jobId: string) => void;
  onToggleStatus: (jobId: string, currentStatus: boolean) => void;
  onEdit: (job: JobData) => void;
}

export function ViewJobModal({
  isOpen,
  onClose,
  job,
  onDelete,
  onToggleStatus,
  onEdit,
}: ViewJobModalProps) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* CONTAINER PRINCIPAL */}
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#121214] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-zinc-800/50 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-white">{job.title}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  job.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                }`}
              >
                {job.isActive ? "Aberta" : "Encerrada"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
              <div className="flex items-center gap-1.5">
                <FiBriefcase
                  className={
                    job.isInternship ? "text-amber-500" : "text-purple-500"
                  }
                />
                <span>{job.isInternship ? "Estágio" : "Efetivo"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiMapPin className="text-blue-500" />
                <span>{job.type}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors bg-zinc-800/30 p-2 rounded-xl hover:bg-zinc-700/50"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {/* COMPETÊNCIAS OBRIGATÓRIAS */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
              Competências Obrigatórias
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills && job.requiredSkills.length > 0 ? (
                job.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-900/20 border border-blue-800/40 px-3.5 py-1.5 text-sm font-medium text-blue-400"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic">
                  Nenhuma competência obrigatória listada.
                </p>
              )}
            </div>
          </div>

          {/* DIFERENCIAIS / DESEJÁVEIS*/}
          {job.desirableSkills && job.desirableSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
                Diferenciais / Desejáveis (Plus)
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.desirableSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-purple-900/20 border border-purple-800/40 px-3.5 py-1.5 text-sm font-medium text-purple-400"
                  >
                    +{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOBRE A VAGA */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
              Sobre a Vaga
            </h3>
            <div className="rounded-xl bg-zinc-900/40 p-5 border border-zinc-800/50">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {job.description ||
                  "Nenhuma descrição detalhada fornecida para esta vaga."}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 pt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-zinc-800/50 bg-[#121214] shrink-0">
          <button
            onClick={() => onDelete(job.id)}
            className="rounded-xl border border-red-900/50 bg-red-950/20 px-5 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900/40 hover:text-red-400"
          >
            Excluir Vaga
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => onToggleStatus(job.id, job.isActive)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
                job.isActive
                  ? "border-amber-700/50 bg-amber-900/20 text-amber-500 hover:bg-amber-900/40"
                  : "border-emerald-700/50 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40"
              }`}
            >
              {job.isActive ? "Encerrar Vaga" : "Reabrir Vaga"}
            </button>
            <button
              onClick={() => onEdit(job)}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-700 hover:scale-[1.02]"
            >
              <FiEdit2 size={16} /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
