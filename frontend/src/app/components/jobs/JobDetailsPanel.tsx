"use client";
import { useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiTrash2, FiUsers, FiClock, FiXCircle } from "react-icons/fi";
import { JobData, ApplicantUser } from "./JobCard";

interface JobDetailsPanelProps {
  vaga: JobData | null;
  onSelectStudent: (studentData: { user: ApplicantUser; jobId: string; status: string }) => void;
  onRemoveApplicant: (jobId: string, userId: string, studentName: string) => void;
}

export function JobDetailsPanel({
  vaga,
  onSelectStudent,
  onRemoveApplicant,
}: JobDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "INTERVIEWING" | "REJECTED">("PENDING");

  if (!vaga) {
    return (
      <div className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-zinc-500 p-8 min-h-[600px] shadow-inner">
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 mb-4">
          <FiUsers className="text-4xl text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-400">Nenhuma Vaga Selecionada</h3>
        <p className="mt-2 text-sm max-w-xs text-center leading-relaxed">
          Selecione uma vaga na lista ao lado para gerenciar o funil de candidatos e analisar o fit de cada talento.
        </p>
      </div>
    );
  }

  const getStatusCount = (status: string) => vaga.applications?.filter(app => (app.status || "PENDING") === status).length || 0;

  return (
    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col h-[calc(100vh-160px)] min-h-[600px] overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400 mb-1">{vaga.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-400">{vaga.type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {vaga.isInternship ? "Estágio" : "Geral"}
              </span>
            </div>
          </div>
          <div className="text-right bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl shadow-inner">
            <div className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
              {vaga.applications?.length || 0}
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Candidatos</p>
          </div>
        </div>

        {/* Abas do CRM (Segmented Control Premium) */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-950 border border-zinc-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg transition-all ${
              activeTab === "PENDING" ? "bg-zinc-800 text-white shadow-md border border-white/5" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FiClock size={14} /> Novos ({getStatusCount("PENDING")})
          </button>
          <button
            onClick={() => setActiveTab("INTERVIEWING")}
            className={`flex-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg transition-all ${
              activeTab === "INTERVIEWING" ? "bg-blue-500/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20" : "text-zinc-500 hover:text-blue-300/60"
            }`}
          >
            <FiUsers size={14} /> Em Conversa ({getStatusCount("INTERVIEWING")})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`flex-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg transition-all ${
              activeTab === "REJECTED" ? "bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/20" : "text-zinc-500 hover:text-red-300/60"
            }`}
          >
            <FiXCircle size={14} /> Descartados ({getStatusCount("REJECTED")})
          </button>
        </div>
      </div>

      {/* Grid de Candidatos */}
      <div className="flex-1 overflow-y-auto p-6 bg-black/40 relative z-10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="grid gap-4 xl:grid-cols-2">
          {vaga.applications
            ?.filter((app) => (app.status || "PENDING") === activeTab)
            .map((app, idx) => {
              const aluno = app.user;
              if (!aluno) return null;

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
                  className="group relative bg-zinc-900/80 backdrop-blur-md border border-white/5 p-5 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:bg-zinc-800/80 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity duration-500 ${
                    matchPercentage >= 75 ? "bg-linear-to-r from-green-500/0 via-green-500/80 to-green-500/0 opacity-0 group-hover:opacity-100" :
                    matchPercentage >= 40 ? "bg-linear-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0 opacity-0 group-hover:opacity-100" :
                    "bg-linear-to-r from-zinc-500/0 via-zinc-500/80 to-zinc-500/0 opacity-0 group-hover:opacity-100"
                  }`} />

                  <div className="absolute top-4 right-4 flex items-center justify-center w-11 h-11 rounded-xl border bg-zinc-950 border-zinc-800 group-hover:border-blue-500/30 transition-colors shadow-inner">
                    <span className={`text-sm font-black ${
                      matchPercentage >= 75 ? "text-green-400" :
                      matchPercentage >= 40 ? "text-blue-400" : "text-zinc-400"
                    }`}>
                      {matchPercentage}%
                    </span>
                  </div>

                  <div className="pr-14">
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {aluno.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 truncate">
                      {aluno.course || "Curso não informado"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {metSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {metSkills.map((req, i) => (
                          <span
                            key={`met-${i}`}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20"
                          >
                            <FiCheckCircle size={10} /> {req}
                          </span>
                        ))}
                      </div>
                    )}
                    {missingSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((req, i) => (
                          <span
                            key={`miss-${i}`}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 opacity-70 group-hover:opacity-100 transition-opacity"
                            title="Requisito faltante"
                          >
                            <FiAlertCircle size={10} /> {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveApplicant(vaga.id, aluno.id, aluno.name);
                      }}
                      className="text-zinc-500 hover:text-red-400 bg-zinc-800/40 hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      title="Descartar candidato"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          
          {vaga.applications?.filter((app) => (app.status || "PENDING") === activeTab).length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800/50 rounded-2xl bg-zinc-900/20">
              <div className="p-3 bg-zinc-900 rounded-full mb-3">
                <FiUsers className="text-2xl opacity-50" />
              </div>
              <p className="text-sm font-medium">Nenhum candidato nesta etapa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
