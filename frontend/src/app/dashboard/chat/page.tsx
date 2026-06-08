"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMessageSquare, FiSearch } from "react-icons/fi";

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface MessagePreview {
  content: string;
  createdAt: string;
}

interface Room {
  id: string;
  context: string;
  users: Participant[];
  messages: MessagePreview[];
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Room[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "TODOS" | "STUDENT" | "RECRUITER"
  >("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Buscar todas as salas do usuário logado
  useEffect(() => {
    async function fetchConversations() {
      try {
        const token = localStorage.getItem("connectu_token");
        const res = await fetch("http://localhost:3333/conversations", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error("Erro ao buscar conversas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, []);

  // 2. Filtro derivado (Corrigindo o erro de "set-state-in-effect")
  const filteredConversations = conversations.filter((room) => {
    const matchRole =
      activeFilter === "TODOS" ||
      room.users.some((u) => u.role === activeFilter);
    const matchSearch =
      searchQuery.trim() === "" ||
      room.users.some((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    return matchRole && matchSearch;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-zinc-950 text-white overflow-hidden">
      {/* COLUNA DA ESQUERDA: LISTA DE CONVERSAS */}
      <aside className="w-full md:w-96 border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-full shrink-0">
        {/* Header da lista */}
        <div className="p-4 border-b border-zinc-800 space-y-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FiMessageSquare className="text-blue-500" /> Mensagens
          </h1>

          {/* Barra de Pesquisa */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filtros Estilo "Pílula" igual ao seu desenho */}
          <div className="flex gap-2">
            {(["TODOS", "STUDENT", "RECRUITER"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  activeFilter === filter
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {filter === "TODOS"
                  ? "Todos"
                  : filter === "STUDENT"
                    ? "Alunos"
                    : "Recrutadores"}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem rolável de contatos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Carregando conversas...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm italic">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            filteredConversations.map((room) => {
              const otherUser = room.users[0];
              const lastMessage = room.messages[0];

              if (!otherUser) return null;

              return (
                <div
                  key={room.id}
                  onClick={() => router.push(`/dashboard/chat/${room.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 cursor-pointer border border-transparent hover:border-zinc-800 transition-all group"
                >
                  {/* Avatar do Contato */}
                  <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-blue-500 shrink-0 overflow-hidden">
                    {otherUser.avatarUrl ? (
                      <Image
                        src={otherUser.avatarUrl}
                        alt={otherUser.name}
                        width={44}
                        height={44}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherUser.name.charAt(0)
                    )}
                  </div>

                  {/* Informações de Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                        {otherUser.name}
                      </h4>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 font-bold ${
                          otherUser.role === "RECRUITER"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {otherUser.role === "RECRUITER"
                          ? "Recrutador"
                          : "Aluno"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {lastMessage
                        ? lastMessage.content
                        : "Nenhuma mensagem ainda..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* COLUNA DA DIREITA: TELA INICIAL (STANDBY) */}
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-950/40 p-8 text-center border-l border-zinc-900">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 shadow-xl">
          <FiMessageSquare size={28} />
        </div>
        <h3 className="text-base font-bold text-zinc-300">
          Sua Central de Mensagens
        </h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
          Selecione uma conversa na lista lateral para abrir o chat em tempo
          real e negociar oportunidades.
        </p>
      </main>
    </div>
  );
}
