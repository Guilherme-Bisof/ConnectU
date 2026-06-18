import { FiX } from "react-icons/fi";

interface EditBasicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  editName: string;
  setEditName: (val: string) => void;
  editAvatarUrl: string;
  setEditAvatarUrl: (val: string) => void;
  setAvatarFile: (file: File | null) => void;
  editBannerUrl: string;
  setEditBannerUrl: (val: string) => void;
  setBannerFile: (file: File | null) => void;
  editCourse: string;
  setEditCourse: (val: string) => void;
  editInstitution: string;
  setEditInstitution: (val: string) => void;
  editDegreeType: string;
  setEditDegreeType: (val: string) => void;
  editStartDate: string;
  setEditStartDate: (val: string) => void;
  editEndDate: string;
  setEditEndDate: (val: string) => void;
  setResumeFile: (file: File | null) => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function EditBasicProfileModal({
  isOpen,
  onClose,
  userRole,
  editName,
  setEditName,
  editAvatarUrl,
  setEditAvatarUrl,
  setAvatarFile,
  editBannerUrl,
  setEditBannerUrl,
  setBannerFile,
  editCourse,
  setEditCourse,
  editInstitution,
  setEditInstitution,
  editDegreeType,
  setEditDegreeType,
  editStartDate,
  setEditStartDate,
  editEndDate,
  setEditEndDate,
  setResumeFile,
  onSave,
  isSaving,
}: EditBasicProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-white">Editar Dados Básicos</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          {/* Campos universais (Aluno e Empresa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-300 mb-1 block">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Foto de Perfil (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAvatarFile(e.target.files[0]);
                  }
                }}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sma file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Deixe em branco para usar sua inicial colorida.
              </p>
              {editAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setEditAvatarUrl("")}
                  className="mt-2 text-xs font-bold text-red-500 hover:text-red-400"
                >
                  Remover foto atual
                </button>
              )}
            </div>

            <div className="sm:col-span-2 mt-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Imagem de Capa (Banner)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setBannerFile(e.target.files[0]);
                  }
                }}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Recomendamos imagens horizontais com boa resolução.
              </p>
              {editBannerUrl && (
                <button
                  type="button"
                  onClick={() => setEditBannerUrl("")}
                  className="mt-2 text-xs font-bold text-red-500 hover:text-red-400"
                >
                  Remover banner atual
                </button>
              )}
            </div>
          </div>

          {/* Campos especificos para Alunos */}
          {userRole === "STUDENT" && (
            <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                Dados Acadêmicos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Curso
                  </label>
                  <input
                    type="text"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    placeholder="Ex: Gestão de TI"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Instituição
                  </label>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    placeholder="Ex: FATEC"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Nivel de Formação
                  </label>
                  <select
                    value={editDegreeType}
                    onChange={(e) => setEditDegreeType(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="Técnico">Ensino Técnico</option>
                    <option value="Tecnólogo">Tecnólogo</option>
                    <option value="Bacharelado">Bacharelado</option>
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Pós-graduação">
                      Pós-graduação / Especialização
                    </option>
                    <option value="Mestrado">Mestrado</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Mês/Ano de Início
                  </label>
                  <input
                    type="text"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    placeholder="Ex: 02/2024"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Previsão de Conclusão
                  </label>
                  <input
                    type="text"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    placeholder="Ex: 12/2026"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-300 mb-1 block">
                    Arquivo do Currículo (Opcional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
