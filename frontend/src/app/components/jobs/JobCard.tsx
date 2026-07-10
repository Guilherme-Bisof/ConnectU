"use client";
import {
  FiUsers,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

export interface ApplicantUser {
  id: string;
  name: string;
  course?: string;
  institution?: string;
  skills?: string[];
}

export interface Applicant {
  userId: string;
  user?: ApplicantUser;
  status?: string;
}

export interface JobData {
  id: string;
  title: string;
  type: string;
  description?: string;
  requiredSkills: string[];
  desirableSkills: string[];
  isInternship: boolean;
  isActive: boolean;
  applications?: Applicant[];
}

interface JobCardProps {
  vaga: JobData;
  onToggleStatus: (jobId: string, currentStatus: boolean) => void;
  onEdit: (vaga: JobData) => void;
  onDelete: (jobId: string) => void;
  isSelected?: boolean;
  onSelectJob?: (vaga: JobData) => void;
}

export function JobCard({
  vaga,
  onToggleStatus,
  onEdit,
  onDelete,
  isSelected,
  onSelectJob,
}: JobCardProps) {
  const totalCandidatos = vaga.applications?.length || 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Card Principal da Vaga */}
      <div
        onClick={() => onSelectJob && onSelectJob(vaga)}
        className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? "bg-blue-600/5 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            : vaga.isActive
            ? "bg-zinc-950 border-white/5 hover:border-blue-500/20 hover:bg-zinc-900/50"
            : "bg-zinc-950 border-zinc-900 opacity-60 grayscale-30 hover:grayscale-0"
        }`}
      >
        {/* Acento lateral esquerdo (Ativo/Selecionado) */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
          isSelected ? "bg-blue-500" : vaga.isActive ? "bg-zinc-700 group-hover:bg-blue-500/50" : "bg-zinc-800"
        }`} />

        {/* Informações da Vaga */}
        <div className="flex-1 pl-2">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-base font-bold text-white line-clamp-1">{vaga.title}</h2>
            {/* Toggle Switch Moderno */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(vaga.id, vaga.isActive);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                vaga.isActive ? "bg-blue-500" : "bg-zinc-700"
              }`}
              title={vaga.isActive ? "Pausar Vaga" : "Ativar Vaga"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  vaga.isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
            <span>{vaga.type}</span>
            {vaga.isInternship && (
              <>
                <span>•</span>
                <span className="text-amber-400/90 font-medium">Estágio</span>
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {vaga.requiredSkills.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                {skill}
              </span>
            ))}
            {vaga.requiredSkills.length > 3 && (
              <span className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-md">
                +{vaga.requiredSkills.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Ações e Métricas Inferiores */}
        <div className="flex items-center justify-between pl-2 border-t border-zinc-800/50 pt-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <FiUsers className={totalCandidatos > 0 ? "text-blue-400" : ""} size={14} />
            <span className={`text-xs font-medium ${totalCandidatos > 0 ? "text-blue-400" : ""}`}>
              {totalCandidatos} {totalCandidatos === 1 ? "Candidato" : "Candidatos"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vaga);
              }}
              className="text-zinc-500 hover:text-white bg-zinc-800/40 hover:bg-zinc-700 p-1.5 rounded-md transition-colors"
              title="Editar Vaga"
            >
              <FiEdit2 size={14} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vaga.id);
              }}
              className="text-zinc-500 hover:text-red-400 bg-zinc-800/40 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
              title="Excluir Vaga"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
