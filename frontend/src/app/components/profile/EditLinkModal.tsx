import { FiX } from "react-icons/fi";
import { UserLink, getLinkIcon } from "./ProfileLinks";

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkLabel: string;
  setLinkLabel: (val: string) => void;
  linkUrl: string;
  setLinkUrl: (val: string) => void;
  tempLinks: UserLink[];
  onAddLink: (e: React.FormEvent) => void;
  onRemoveLink: (index: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditLinkModal({
  isOpen,
  onClose,
  linkLabel,
  setLinkLabel,
  linkUrl,
  setLinkUrl,
  tempLinks,
  onAddLink,
  onRemoveLink,
  onSave,
  isSaving,
}: EditLinkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Editar Links</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={onAddLink} className="mb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Título"
              className="w-1/3 rounded-md border border-zinc-800 bg-zinc-950a px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL"
              className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!linkLabel || !linkUrl}
            className="w-full rounded-md bg-zinc-800 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Adicionar Link
          </button>
        </form>
        <div className="mb-8 flex flex-col gap-2 max-h-40 overflow-y-auto">
          {tempLinks.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum link.</p>
          ) : (
            tempLinks.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-400">
                    {getLinkIcon(link.label)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {link.label}
                    </p>
                    <p className="text-xs text-zinc-500 truncate max-w-37.5">
                      {link.url}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveLink(index)}
                  className="text-zinc-500 hover:text-red-400"
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
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
