"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiX, FiSearch } from "react-icons/fi";
import { apiEndpoint } from "@/lib/api";
import { useRouter } from "next/navigation";

interface UserResult {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  course?: string | null;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export function NewConversationModal({ isOpen, onClose, currentUserId }: NewConversationModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setError("");
    onClose();
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim() === "") {
        setResults([]);
        setError("");
        return;
      }
      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("connectu_token");
        const res = await fetch(apiEndpoint(`/users/search?q=${encodeURIComponent(query)}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Excluir a si próprio da busca
          const filtered = data.filter((u: UserResult) => u.id !== currentUserId);
          setResults(filtered);
          if (filtered.length === 0) setError("Nenhum usuário encontrado.");
        } else {
          setError("Erro ao buscar usuários.");
        }
      } catch (e) {
        setError("Erro de rede ao buscar usuários.");
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentUserId]);

  const handleSelectUser = async (userId: string) => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(apiEndpoint("/conversations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ participantId: userId })
      });

      if (res.ok) {
        const room = await res.json();
        handleClose();
        router.push(`/dashboard/chat/${room.id}`);
      } else {
        alert("Erro ao criar conversa.");
      }
    } catch (error) {
      alert("Erro ao conectar ao servidor.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-[480px] bg-surface-container rounded-2xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant shrink-0">
          <h2 className="text-title-lg font-bold text-on-surface">Nova Conversa</h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-4 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <FiSearch size={18} />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar pessoas..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-body-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/60 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!isLoading && error && (
              <div className="text-center py-10 text-on-surface-variant">
                <p className="text-body-md">{error}</p>
              </div>
            )}

            {!isLoading && !error && results.length > 0 && (
              <div className="space-y-1">
                {results.map((user) => (
                  <button
                    key={user.id}
                    disabled={isCreating}
                    onClick={() => handleSelectUser(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-highest transition-colors text-left disabled:opacity-50"
                  >
                    <div className="shrink-0 relative">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary text-lg">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface truncate">{user.name}</p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {user.role === "STUDENT" ? "Aluno(a)" : "Recrutador(a)"}
                        {user.course ? ` • ${user.course}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
