import { FiPlus, FiExternalLink } from "react-icons/fi";

export interface UserProject {
  id?: string;
  title: string;
  description: string;
  link?: string;
}

interface ProfileProjectsProps {
  projects?: UserProject[];
  onOpenModal: () => void;
}

export function ProfileProjects({
  projects,
  onOpenModal,
}: ProfileProjectsProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Vitrine de Projetos</h3>
        <button
          onClick={onOpenModal}
          className="text-blue-500 hover:text-blue-400 transition-colors"
        >
          <FiPlus />
        </button>
      </div>
      <div
        className="grid grid-cols-1 sm:gridgols2
       gap-4"
      >
        {!projects || projects.length === 0 ? (
          <p className="text-sm text-zinc-500 italic col-span-2">
            Nenhum projeto cadastrado
          </p>
        ) : (
          projects.map((project, index) => (
            <div
              key={index}
              className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-blue-500"
            >
              <div>
                <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                  {project.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3">
                  {project.description}
                </p>
              </div>
              {project.link && (
                <a
                  href={
                    project.link.startsWith("http")
                      ? project.link
                      : `https://${project.link}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-400"
                >
                  Acessar Projeto <FiExternalLink />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
