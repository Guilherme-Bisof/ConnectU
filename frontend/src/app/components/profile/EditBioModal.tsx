import { FiX } from "react-icons/fi";

interface EditBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  bioInput: string;
  setBioInput: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditBioModal({
  isOpen,
  onClose,
  bioInput,
  setBioInput,
  onSave,
  isSaving,
}: EditBioModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[512px] rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Editar Resumo</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        <textarea
          value={bioInput}
          onChange={(e) => setBioInput(e.target.value)}
          placeholder="Escreva um breve resumo..."
          className="w-full h-40 resize-none rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
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
