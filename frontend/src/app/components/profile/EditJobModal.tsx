import { FiX, FiTarget } from "react-icons/fi";

export interface JobFormData {
  title: string;
  type: string;
  description: string;
  skillsInput: string;
  desirableSkillsInput: string;
  isInternship: boolean;
}

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobFormData: JobFormData;
  setJobFormData: (data: JobFormData) => void;
  onSave: () => void;
  isSubmitting: boolean;
  editingJobId: string | null;
}

export function EditJobModal({
  isOpen,
  onClose,
  jobFormData,
  setJobFormData,
  onSave,
  isSubmitting,
  editingJobId,
}: EditJobModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-[512px] rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-auto">
        <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiTarget className="text-purple-400" />{" "}
              {editingJobId ? "Editar Oportunidade" : "Nova Oportunidade"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Defina os requisitos para o algoritmo encontrar o talento ideal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Título da Vaga
            </label>
            <input
              required
              type="text"
              placeholder="Ex: Desenvolvedor Front-end Junior"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              value={jobFormData.title}
              onChange={(e) =>
                setJobFormData({ ...jobFormData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Tipo / Modelo
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              value={jobFormData.type}
              onChange={(e) =>
                setJobFormData({ ...jobFormData, type: e.target.value })
              }
            >
              <option value="Tempo Integral">Tempo Integral</option>
              <option value="Meio Período">Meio Período</option>
              <option value="Estágio">Estágio</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Descrição
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva as responsabilidades e requisitos básicos..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              value={jobFormData.description}
              onChange={(e) =>
                setJobFormData({ ...jobFormData, description: e.target.value })
              }
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Skills Necessárias (separadas por vírgula)
            </label>
            <input
              required
              type="text"
              placeholder="Ex: React, JavaScript, Figma"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              value={jobFormData.skillsInput}
              onChange={(e) =>
                setJobFormData({ ...jobFormData, skillsInput: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300 ml-1">
              Skills Desejáveis / Plus (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Ex: Docker, AWS, UI/UX"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              value={jobFormData.desirableSkillsInput}
              onChange={(e) =>
                setJobFormData({
                  ...jobFormData,
                  desirableSkillsInput: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="profileIsInternship"
              checked={jobFormData.isInternship}
              onChange={(e) =>
                setJobFormData({
                  ...jobFormData,
                  isInternship: e.target.checked,
                })
              }
              className="w-5
               h-5 border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-950"
            />
            <label
              htmlFor="profileIsInternship"
              className="text-sm font-medium text-zinc-300 cursor-pointer"
            >
              Esta vaga é exclusiva para estágio?
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={
              isSubmitting || !jobFormData.title || !jobFormData.skillsInput
            }
            className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600"
          >
            {isSubmitting
              ? "Salvando..."
              : editingJobId
                ? "Guardar Alterações"
                : "Salvar Vaga"}
          </button>
        </div>
      </div>
    </div>
  );
}
