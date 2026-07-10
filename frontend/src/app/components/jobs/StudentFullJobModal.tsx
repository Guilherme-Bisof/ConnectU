import { FiX, FiBriefcase, FiMapPin, FiCheck } from "react-icons/fi";

interface JobData {
  id: string;
  title: string;
  type: string;
  description?: string;
  companyName?: string;
  location?: string;
  requiredSkills: string[];
  desirableSkills?: string[];
}

interface StudentFullJobModalProps {
  job: JobData;
  isOpen: boolean;
  hasApplied: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
}

export function StudentFullJobModal({
  job,
  isOpen,
  hasApplied,
  onClose,
  onApply,
}: StudentFullJobModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] animate-slideInRight">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800/50 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <FiBriefcase className="text-blue-500" />{" "}
                {job.companyName || "Empresa Confidencial"}
              </span>
              <span className="flex items-center gap-1.5">
                <FiMapPin /> {job.location || job.type}a
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2.5 rounded-xl transition-colors border border-zinc-700/50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* Descrição */}
          <div>
            <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">
              Descrição da Vaga
            </h3>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/60">
              {job.description ||
                "O recrutador não forneceuj uma descrição detalhada para esta vaga."}
            </div>
          </div>

          {/* Resumo das skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
                Obrigatórias
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-blue-900/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.desirableSkills && job.desirableSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
                  Diferenciais
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.desirableSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-purple-900/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="p-6 border-t border-zinc-800/50 shrink-0 bg-zinc-900/30 rounded-b-2xl flex justify-end gap-4 items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Voltar
          </button>

          <button
            onClick={() => onApply(job.id)}
            disabled={hasApplied}
            className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white transition-all ${hasApplied ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"}`}
          >
            {hasApplied ? (
              <>
                {" "}
                <FiCheck /> Candidatura Enviada
              </>
            ) : (
              "Candidatar-se agora"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
