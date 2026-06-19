import { FiZap, FiAward, FiBriefcase, FiEdit2 } from "react-icons/fi";

export interface ProfileHeaderUser {
  name: string;
  role: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPioneer?: boolean;
  degreeType?: string;
  course?: string;
  institution?: string;
  startDate?: string;
  endDate?: string;
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser;
  onEditClick: () => void;
}

export function ProfileHeader({ user, onEditClick }: ProfileHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
      <div
        className={`h-32 sm:h-48 w-full bg-cover bg-center bg-no-repeat ${!user.bannerUrl ? (user.role === "RECRUITER" ? "bg-linear-to-r from-purple-900 to-zinc-900" : "bg-linear-to-r from-blue-900 to-zinc-800") : ""}`}
        style={
          user.bannerUrl ? { backgroundImage: `url('${user.bannerUrl}')` } : {}
        }
      ></div>

      <div className="relative px-4 sm:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Foto e Emblema */}
          <div className="relative -mt-12 sm:-mt-16 flex h-24 w-24 sm:h-32 sm:w-32 shrink-0 items-center justify-center mx-auto sm:mx-0">
            <div
              className={`flex h-full w-full items-center justify-center rounded-2xl border-4 border-zinc-900 text-3xl font-bold text-white shadow-2xl overflow-hidden ${user.role === "RECRUITER" ? "bg-zinc-800" : "bg-blue-600"}`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            {user.role === "RECRUITER" && (
              <div
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-purple-600 text-white z-10"
                title="Conta Verificada"
              >
                <FiZap size={14} />
              </div>
            )}
          </div>

          {/* Conteinar do texto e botao */}
          <div className="flex flex-col md:flex-row md:items-start justify-between flex-1 mt-2 sm:mt-4 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {user.name}
              </h1>
              {user.isPioneer && (
                <div
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/40 px-3 py-1 shadow-md backdrop-blur-md"
                  title="Membro Fundador do ConnectU"
                >
                  <FiAward className="text-amber-400" size={14} />
                  <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                    Pioneiro
                  </span>
                </div>
              )}
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-center sm:justify-starta gap-2 font-medium text-zinc-400">
                {user.role === "STUDENT" ? (
                  <>
                    <span>
                      {user.degreeType || "Cursando"} em{" "}
                      {user.course || "Não informado"} na{" "}
                      {user.institution || "Não informada"}{" "}
                    </span>
                    {(user.startDate || user.endDate) && (
                      <span className="hidden sm:block text-zinc-600">•</span>
                    )}
                    {(user.startDate || user.endDate) && (
                      <span className="text-zinc-500 text-sm">
                        {user.startDate || "?"} até {user.endDate || "Atual"}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="flex w-fit items-center gap-2 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-sm border border-purple-500/20 mx-auto sm:mx-0">
                    <FiBriefcase size={14} /> Equipe de Talentos
                  </span>
                )}
              </div>
            </div>

            {/* Botão de Editar */}
            <div className="flex justify-center sm:justify-start shrink-0">
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 hover:border-zinc-600 backdrop-blur-sm"
              >
                <FiEdit2 /> Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
