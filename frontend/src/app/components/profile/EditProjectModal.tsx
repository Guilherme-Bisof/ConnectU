import { FiX } from "react-icons/fi";
import { createPortal } from "react-dom";
import { UserProject } from "./ProfileProjects";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  setProjectTitle: (val: string) => void;
  projectDesc: string;
  setProjectDesc: (val: string) => void;
  projectLink: string;
  setProjectLink: (val: string) => void;
  tempProjects: UserProject[];
  onAddProject: (e: React.FormEvent) => void;
  onRemoveProject: (index: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditProjectModal({
  isOpen,
  onClose,
  projectTitle,
  setProjectTitle,
  projectDesc,
  setProjectDesc,
  projectLink,
  setProjectLink,
  tempProjects,
  onAddProject,
  onRemoveProject,
  onSave,
  isSaving,
}: EditProjectModalProps) {
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="
        fixed inset-x-[12px] bottom-[max(12px,env(safe-area-inset-bottom))] top-[76px] z-[101]
        flex flex-col overflow-hidden rounded-[16px] border border-zinc-800 bg-[#17191d] shadow-xl
        sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90dvh] sm:w-full sm:max-w-[512px] sm:-translate-x-1/2 sm:-translate-y-1/2
      ">
        <header className="shrink-0 p-6 flex items-center justify-between border-b border-zinc-800/50">
          <h2 className="text-xl font-bold text-white">Editar Projetos</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 profile-modal-content">
        <form
          onSubmit={onAddProject}
          className="mb-8 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
        >
          <h3 className="text-sm font-semibold text-zinc-300">
            Adicionar Novo
          </h3>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Título"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <textarea
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="Descrição..."
            className="w-full h-20 resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={projectLink}
            onChange={(e) => setProjectLink(e.target.value)}
            placeholder="Link (Opcional)"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!projectTitle || !projectDesc}
            className="w-full rounded-md bg-blue-600/20 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600 hover:text-white disabled:opacity-50 mt-2"
          >
            + Inserir na Lista
          </button>
        </form>
        <div className="mb-8 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            Projetos Atuais
          </h3>
          {tempProjects.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              Nenhum projeto adicionado
            </p>
          ) : (
            tempProjects.map((project, index) => (
              <div
                key={index}
                className="relative rounded-md border border-zinc-800 bg-zinc-950 p-3 pr-10"
              >
                <h4 className="text-sm font-bold text-white">
                  {project.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {project.description}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveProject(index)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-red-400"
                >
                  <FiX />
                </button>
              </div>
            ))
          )}
        </div>
        </div>
        <footer className="shrink-0 flex justify-end gap-3 border-t border-zinc-800 p-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </footer>
      </div>
    </>,
    document.body
  );
}
