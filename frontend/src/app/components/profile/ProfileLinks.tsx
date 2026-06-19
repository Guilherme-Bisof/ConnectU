import {
  FiPlus,
  FiGithub,
  FiLinkedin,
  FiYoutube,
  FiGlobe,
  FiLink,
} from "react-icons/fi";
import { FaBehance } from "react-icons/fa";

export interface UserLink {
  id?: string;
  label: string;
  url: string;
}

interface ProfileLinksProps {
  links?: UserLink[];
  onOpenModal: () => void;
}

export function getLinkIcon(label: string) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("github")) return <FiGithub className="text-lg" />;
  if (lowerLabel.includes("behance")) return <FaBehance className="text-lg" />;
  if (lowerLabel.includes("linkedin"))
    return <FiLinkedin className="text-lg" />;
  if (lowerLabel.includes("youtube")) return <FiYoutube className="text-lg" />;
  if (lowerLabel.includes("site") || lowerLabel.includes("port"))
    return <FiGlobe className="text-lg" />;
  return <FiLink className="text-lg" />;
}

export function ProfileLinks({ links, onOpenModal }: ProfileLinksProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Links Oficiais</h3>
        <button
          onClick={onOpenModal}
          className="text-blue-500 hover:text-blue-400 transition-colors"
        >
          <FiPlus />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {!links || links.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">Nenhum link cadastrado</p>
        ) : (
          links.map((link, index) => (
            <a
              key={index}
              href={
                link.url.startsWith("http") ? link.url : `https://${link.url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 transition-colors hover:border-blue-500 hover:text-blue-400"
            >
              {getLinkIcon(link.label)}
              <span className="truncate">{link.label}</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
