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
    <div className="fixed inset-0 z-60 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-slideInRight">
        {/* Header*/}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <form id="jobForm" onSubmit={onSubmit} className="space-y-6">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Título da Vaga
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Desenvolvedor Front-end Junior"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Tipo / Modelo
              </label>
              <div className="relative">
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Descrição
              </label>
              <textarea
                required
                rows={4}
                placeholder="Descreva as responsabilidades e requisitos básicos..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none placeholder:text-zinc-600"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              ></textarea>
            </div>

            <div className="pt-2">
              <TagInput
                label="Skills Obrigatórias (Enter)"
                placeholder="Ex: React, JavaScript"
                tags={formData.requiredSkills}
                setTags={(tags) =>
                  setFormData({ ...formData, requiredSkills: tags })
                }
              />
            </div>

            <div className="pt-2">
              <TagInput
                label="Diferenciais / Plus (Enter)"
                placeholder="Ex: Docker, UI/UX"
                tags={formData.desirableSkills}
                setTags={(tags) =>
                  setFormData({ ...formData, desirableSkills: tags })
                }
              />
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 mt-4">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  id="isInternshipCheck"
                  checked={formData.isInternship}
                  onChange={(e) =>
                    setFormData({ ...formData, isInternship: e.target.checked })
                  }
                  className="w-5 h-5 border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500 rounded cursor-pointer transition-all"
                />
              </div>
              <label
                htmlFor="isInternshipCheck"
                className="text-sm font-medium text-blue-100 cursor-pointer flex flex-col"
              >
                Vaga Exclusiva para Estágio
                <span className="text-xs text-blue-300/70 font-normal mt-1 leading-relaxed">
                  Mostra a vaga preferencialmente para alunos que ainda têm mais de 1 ano para concluir o curso.
                </span>
              </label>
            </div>

          </form>
        </div>

        {/* Footer  */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="jobForm"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Processando..." : submitText}
          </button>
        </div>
      </div>
    </div>
  );
}
