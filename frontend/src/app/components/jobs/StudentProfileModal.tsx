import { useState } from "react";
import { FiX, FiBookOpen } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface ApplicantUser {
  id: string;
  name: string;
  course?: string;
  institution?: string;
  skills?: string[];
}

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: { user: ApplicantUser; jobId: string; status: string } | null;
  onStartChat?: (jobId: string, userId: string) => void;
  onChangeStatus?: (jobId: string, userId: string, newStatus: string) => void;
}

export function StudentProfileModal({
  isOpen,
  onClose,
  studentData,
  onStartChat,
  onChangeStatus,
}: StudentProfileModalProps) {
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);

  if (!isOpen || !studentData) return null;
  const { user: student, jobId, status } = studentData;

  const handleStartChat = async () => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      await onStartChat?.(jobId, student.id);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative anime-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md"
        >
          <FiX />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 text-blue-400 flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-3 border-2 border-blue-500/30">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white">{student.name}</h2>
          <p className="text-sm text-blue-400 mt-1">Candidato(a)</p>
        </div>

        <div className="space-y-4 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Fomação Acadêmica
            </p>
            <div className="flex items-starta gap-2 text-zinc-300 text-sm">
              <FiBookOpen className="mt-1 shrink-0 text-zinc-500" />
              <div>
                <p className="font-medium text-white">
                  {student.course || "Curso não preenchido"}
                </p>
                <p className="text-zinc-400">
                  {student.institution || "Instituição não infomada"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Todas as Competências
            </p>
            <div className="flex flex-wrap gap-1.5">
              {student.skills && student.skills.length > 0 ? (
                student.skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic">
                  Nenhuma competência cadastrada.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleStartChat}
              disabled={isStartingChat}
              className={`text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isStartingChat 
                  ? "bg-blue-800 cursor-not-allowed opacity-60" 
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isStartingChat ? "Abrindo..." : "Iniciar Chat"}
            </button>
            <button
              onClick={() => router.push(`/dashboard/perfil/${student.id}`)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Ver Perfil
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {status !== "INTERVIEWING" && (
              <button
                onClick={() => onChangeStatus?.(jobId, student.id, "INTERVIEWING")}
                className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 hover:border-blue-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Avançar (Entrevista)
              </button>
            )}
            {status !== "REJECTED" && (
              <button
                onClick={() => onChangeStatus?.(jobId, student.id, "REJECTED")}
                className="bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 hover:border-red-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Descartar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
