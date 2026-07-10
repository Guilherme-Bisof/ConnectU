import { FiX } from "react-icons/fi";
import { TagInput } from "@/app/components/ui/TagInput";

export interface JobFormData {
  title: string;
  type: string;
  description: string;
  requiredSkills: string[];
  desirableSkills: string[];
  isInternship: boolean;
}

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: JobFormData;
  setFormData: (data: JobFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitText: string;
}

export function JobFormModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitText,
}: JobFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-md"
        >
          <FiX />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Título da Vaga
            </label>
            <input
              required
              type="text"
              placeholder="Ex: Desenvolvedor Front-end Junior"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Tipo / Modelo
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
          </div>

          <div>
            <TagInput
              label="Skills Necessárias (pressione Enter para adicionar)"
              placeholder="Ex: React, JavaScript, Figma"
              tags={formData.requiredSkills}
              setTags={(tags) =>
                setFormData({ ...formData, requiredSkills: tags })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <TagInput
              label="Skills Desejáveis / Plus (pressione Enter para adicionar)"
              placeholder="Ex: Docker, AWS, UI/UX"
              tags={formData.desirableSkills}
              setTags={(tags) =>
                setFormData({ ...formData, desirableSkills: tags })
              }
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isInternshipCheck"
              checked={formData.isInternship}
              onChange={(e) =>
                setFormData({ ...formData, isInternship: e.target.checked })
              }
              className="w-5 h-5 border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-950"
            />
            <label
              htmlFor="isInternshipCheck"
              className="text-sm font-medium text-zinc-300 cursor-pointer flex flex-col"
            >
              Esta vaga é exclusiva para Estágio?
              <span className="text-xs text-zinc-500 font-normal">
                (Filtra alunos que faltam 1+ anos para terminar o curso)
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processando..." : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
