import { FiPlus } from "react-icons/fi";

interface ProfileSkillsProps {
    skills?: string[];
    onOpenModal: () => void;
}

export function ProfileSkills({ skills, onOpenModal}: ProfileSkillsProps) {
    return (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">
                        Competências (Skills)
                    </h3>
                    <p className="text-xs text-zinc-500">
                        Estas habilidades aumentam seu Match com as vagas
                    </p>
                </div>
                <button onClick={onOpenModal} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm font-medium">
                    <FiPlus /> Adicionar
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {!skills || skills.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">
                        Nenhuma competência cadastrada ainda.
                    </p>
                ) : (
                    skills.map((skill, index) => (
                        <span key={index} className="rounded-full bg-blue-900/30 border border-blue-800 px-3 py-1 text-sm text-blue-300">
                            {skill}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}