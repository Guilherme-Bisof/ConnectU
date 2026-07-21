import { FiX } from "react-icons/fi";

interface EditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillInput: string;
  setSkillInput: (val: string) => void;
  tempSkills: string[];
  onAddSkill: (e?: React.FormEvent) => void;
  onRemoveSkill: (skill: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditSkillModal({
  isOpen,
  onClose,
  skillInput,
  setSkillInput,
  tempSkills,
  onAddSkill,
  onRemoveSkill,
  onSave,
  isSaving,
}: EditSkillModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Editar Competências</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={onAddSkill} className="mb-6 flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Ex: React, Figma, Python..."
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Adicionar
          </button>
        </form>
        <div className="mb-8 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {tempSkills.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhuma competência na lista.
            </p>
          ) : (
            tempSkills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-1 rounded-full bg-blue-900/30 border border-blue-800 pl-3 pr-1 py-1 text-sm text-blue-300"
              >
                {skill}
                <button
                  onClick={() => onRemoveSkill(skill)}
                  type="button"
                  className="ml-1 rounded-full p-1 hover:bg-blue-800/50 hover:text-white transition-colors"
                >
                  <FiX />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
