import { FiX, FiEdit2 } from "react-icons/fi";

export interface JobData {
  id: string;
  title: string;
  type: string;
  desirableSkill?: string[];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Container Principal */}
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{job.title}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  job.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                }`}
              >
                {" "}
                {job.isActive ? "Aberta" : "Encerrada"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                {job.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 p-2 rounded-full hover:bg-zinc-700"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Descrição da vaga
            </h3>
            <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-800">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {job.description ||
                  "Nenhuma descrição detalhada fornecida para esta vaga."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Competências Exigidas
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills && job.requiredSkills.length > 0 ? (
                job.requiredSkills.map((skill, index) => (
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

        {/* Footer */}
        <div className="p-6 pt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <button
            onClick={() => onDelete(job.id)}
            className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
          >
            Exluir Vaga
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => onToggleStatus(job.id, job.isActive)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${job.isActive ? "border-yellow-700/50 bg-yellow-900/20 text-yellow-500 hover:bg-yellow-900/40" : "border-emerald-700/50 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40"}`}
            >
              {" "}
              {job.isActive ? "Encerrar Vaga" : "Reabrir Vaga"}
            </button>
            <button
              onClick={() => onEdit(job)}
              className="flex items-center gap-2 rounded-md bg-purple-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-purple-700"
            >
              <FiEdit2 size={14} /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
