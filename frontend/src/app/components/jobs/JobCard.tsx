"use client";
import { useState } from "react";
import {
  FiUsers,
  FiChevronUp,
  FiChevronDown,
  FiPower,
  FiEdit2,
  FiX,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
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
  isExpanded: boolean;
  onToggleExpand: (jobId: string) => void;
  onToggleStatus: (jobId: string, currentStatus: boolean) => void;
  onEdit: (vaga: JobData) => void;
  onDelete: (jobId: string) => void;
  onSelectStudent: (studentData: { user: ApplicantUser; jobId: string; status: string }) => void;
  onRemoveApplicant: (
    jobId: string,
    userId: string,
    studentName: string,
  ) => void;
}

export function JobCard({
  vaga,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onEdit,
  onDelete,
  onSelectStudent,
  onRemoveApplicant,
}: JobCardProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "INTERVIEWING" | "REJECTED">("PENDING");
  const totalCandidatos = vaga.applications?.length || 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Card Principal da Vaga */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl border p-6 transition-all ${
          vaga.isActive
            ? "bg-zinc-900 border-zinc-800 hover:border-blue-500/30"
            : "bg-zinc-950 border-zinc-800/50 opacity-75"
        }`}
      >
        {/* Informações da Vaga */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-bold text-white">{vaga.title}</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                vaga.isActive
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {vaga.isActive ? "Ativa" : "Pausada"}
            </span>

            {vaga.isInternship && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Estágio (Restrito)
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-400 mb-3 line-clamp-1">
            {vaga.type} • {vaga.description || "Sem descrição"}
          </p>

          <div className="flex flex-wrap gap-2">
            {vaga.requiredSkills.map((skill, i) => (
              <span
                key={i}
                className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}

            {vaga.desirableSkills?.map((skill, i) => (
              <span
                key={`des-${i}`}
                className="text-xs bg-purple-900/20 text-purple-300 px-2 py-1 rounded-md border border-purple-900/30"
                title="Desejável / Plus (Peso 1)"
              >
                +{skill}
              </span>
            ))}
          </div>
        </div>

        {/* Ações e Métricas */}
        <div className="flex flex-col md:items-end gap-4 shrink-0 border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
          <button
            disabled={totalCandidatos === 0}
            onClick={() => onToggleExpand(vaga.id)}
            className={`flex items-center justify-between md:justify-end gap-2 px-3 py-1.5 rounded-lg border w-full md:w-auto transition-all ${
              totalCandidatos > 0
                ? "text-blue-400 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                : "text-zinc-500 bg-zinc-800/30 border-zinc-800 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers />
              <span className="text-sm font-medium">
                {totalCandidatos}{" "}
                {totalCandidatos === 1 ? "Candidato" : "Candidatos"}
              </span>
            </div>
            {totalCandidatos > 0 &&
              (isExpanded ? <FiChevronUp /> : <FiChevronDown />)}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onToggleStatus(vaga.id, vaga.isActive)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-md transition-colors"
              title={vaga.isActive ? "Pausar Vaga" : "Ativar Vaga"}
            >
              <FiPower
                className={vaga.isActive ? "text-yellow-400" : "text-green-400"}
              />
            </button>

            <button
              onClick={() => onEdit(vaga)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-blue-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-md transition-colors"
              title="Editar Vaga"
            >
              <FiEdit2 />
            </button>

            <button
              onClick={() => onDelete(vaga.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-md transition-colors border border-red-500/10"
              title="Excluir Vaga"
            >
              <FiX />
            </button>
          </div>
        </div>
      </div>

      {/* CRM: Alunos Expandidos */}
      {isExpanded && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 ml-2 mr-2 -mt-1 animate-fadeIn space-y-4">
          
          {/* Abas do CRM */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "PENDING" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              Novos
            </button>
            <button
              onClick={() => setActiveTab("INTERVIEWING")}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "INTERVIEWING" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-zinc-500 hover:text-blue-300 hover:bg-zinc-900"
              }`}
            >
              Em Conversa
            </button>
            <button
              onClick={() => setActiveTab("REJECTED")}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "REJECTED" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-zinc-500 hover:text-red-300 hover:bg-zinc-900"
              }`}
            >
              Descartados
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {vaga.applications
              ?.filter((app) => (app.status || "PENDING") === activeTab)
              .map((app, idx) => {
                const aluno = app.user;
                if (!aluno) return null;

                // CÁLCULO DE MATCH EM TEMPO REAL
                const requiredCount = vaga.requiredSkills.length;
                const matchCount =
                  aluno.skills?.filter((s) =>
                    vaga.requiredSkills.some(
                      (req) => req.toLowerCase() === s.toLowerCase(),
                    ),
                  ).length || 0;
                const matchPercentage =
                  requiredCount > 0
                    ? Math.round((matchCount / requiredCount) * 100)
                    : 0;

                const metSkills = vaga.requiredSkills.filter(req => aluno.skills?.some(s => s.toLowerCase() === req.toLowerCase()));
                const missingSkills = vaga.requiredSkills.filter(req => !aluno.skills?.some(s => s.toLowerCase() === req.toLowerCase()));

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectStudent({ user: aluno, jobId: vaga.id, status: app.status || "PENDING" })}
                    className="group relative bg-zinc-900 border border-zinc-800/60 p-4 rounded-lg flex flex-col justify-between cursor-pointer transition-all hover:bg-zinc-800/50 hover:border-blue-500/40"
                  >
                    <div className="absolute top-3 right-3 text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      {matchPercentage}% Match
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors pr-16">
                        {aluno.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                        {aluno.course || "Curso não informado"}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {metSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {metSkills.map((req, i) => (
                            <span
                              key={`met-${i}`}
                              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20"
                            >
                              <FiCheckCircle size={10} /> {req}
                            </span>
                          ))}
                        </div>
                      )}
                      {missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {missingSkills.map((req, i) => (
                            <span
                              key={`miss-${i}`}
                              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20"
                              title="Requisito faltante"
                            >
                              <FiAlertCircle size={10} /> {req}
                            </span>
                          ))}
                        </div>
                      )}
                      {vaga.requiredSkills.length === 0 && aluno.skills && (
                        <div className="flex flex-wrap gap-1">
                           <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                             {aluno.skills.length} skills no perfil
                           </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveApplicant(vaga.id, aluno.id, aluno.name);
                      }}
                      className="absolute bottom-3 right-3 text-zinc-500 hover:text-red-400 bg-zinc-800/40 hover:bg-red-500/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover candidato"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                );
              })}
            
            {vaga.applications?.filter((app) => (app.status || "PENDING") === activeTab).length === 0 && (
              <div className="col-span-full p-4 text-center text-sm text-zinc-500 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                Nenhum candidato nesta etapa.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
