import { FiEdit2 } from "react-icons/fi";

interface ProfileBioProps {
  role: string;
  bio?: string;
  onOpenModal: () => void;
}

export function ProfileBio({ role, bio, onOpenModal }: ProfileBioProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {role === "STUDENT" ? "Sobre Mim" : "Nossa Cultura"}
        </h3>
        <button
          onClick={onOpenModal}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <FiEdit2 />
        </button>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-all">
        {bio ? (
          bio
        ) : (
          <span className="italic">
            {role === "STUDENT"
              ? "Nenhum resumo adicionado."
              : "Adicione a missão e cultura da sua empresa."}
          </span>
        )}
      </p>
      {/* Vibe check (apenas recrutadores) */}
      {role === "RECRUITER" && (
        <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1 font-medium">
              <span>Processo Rígido</span>
              <span className="text-purple-400">Inovação Ágil</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-zinc-600 to-purple-500 w-[85%] rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1 font-medium">
              <span>Trabalho Isolado</span>
              <span className="text-blue-400">Colaborativo</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-zinc-600 to-blue-500 w-[90%] rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
