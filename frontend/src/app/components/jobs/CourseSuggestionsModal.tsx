import {
  FiX,
  FiPlayCircle,
  FiExternalLink,
  FiStar,
  FiClock,
  FiAward,
} from "react-icons/fi";

interface CourseSuggestionsModalProps {
  isOpen: boolean;
  missingSkills: string[];
  onClose: () => void;
}

function generateMockCourses(skill: string) {
  const platforms = ["Alura", "Udemy", "Rocketseat", "Coursera"];
  const randomPlatform =
    platforms[Math.floor(Math.random() * platforms.length)];
  const duration = Math.floor(Math.random() * 20) + 4;

  return {
    id: `${skill}-course`,
    title: `${skill} do Zero ao Domínio Completo`,
    platform: randomPlatform,
    duration: `${duration}h`,
    level: "Iniciante a Pleno",
    rating: (Math.random() * (5 - 4.2) + 4.2).toFixed(1),
  };
}

export function CourseSuggestionsModal({
  isOpen,
  missingSkills,
  onClose,
}: CourseSuggestionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] animate-slideInRight overflow-hidden">
        <div className="h-2 w-full bg-linear-to-r from-blue-400 via-emerald-400 to-blue-400 shrink-0"></div>

        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-900/30 border border-blue-500/30 text-2xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <FiStar />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                GPS de Carreira (IA)
              </h2>
              <p className="text-sm text-zinc-400">
                Com base nas competências que faltam para esta vaga,
                selecionamos cursos que podem aumentar suas chances de
                compatibilidade.{" "}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2.5 rounded-xl transition-colors border border-zinc-700/50 ml-4 shrink-0"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Lista de Cursos */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          {missingSkills.length === 0 ? (
            <div className="text-center p-8 border border-zinc-800 rounded-xl bg-zinc-900/50">
              <p className="text-zinc-400">
                Você já possui todas as competências para esta vaga! 🚀
              </p>
            </div>
          ) : (
            missingSkills.map((skill) => {
              const course = generateMockCourses(skill);
              return (
                <div
                  key={course.id}
                  className="group relative bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 hover:border-blue-500/40 transition-all duration-300 hover:bg-zinc-900/80"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                          Foco em: {skill}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <FiStar className="fill-amber-400" /> {course.rating}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <FiPlayCircle /> Plataforma: {course.platform}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiClock /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiAward /> {course.level}
                        </span>
                      </div>
                    </div>

                    <button className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                      <FiExternalLink />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800/50 shrink-0 bg-[#121214] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            Fechar sugestões
          </button>
        </div>
      </div>
    </div>
  );
}
