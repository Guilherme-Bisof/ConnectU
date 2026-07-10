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
        const res = await fetch("https://connectu-gd1z.onrender.com/conversations", {
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
    <div className="flex h-[calc(100vh-4rem)] w-full bg-black text-white overflow-hidden">
      {/* COLUNA DA ESQUERDA: LISTA DE CONVERSAS */}
      <aside className="w-full md:w-[400px] border-r border-white/5 bg-zinc-950/80 flex flex-col h-full shrink-0 relative z-10 backdrop-blur-xl">
        {/* Header da lista */}
        <div className="p-5 border-b border-white/5 space-y-5 bg-linear-to-b from-zinc-900/50 to-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">
              Mensagens
            </h1>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <FiMessageSquare size={16} />
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all shadow-inner"
            />
          </div>

          {/* Filtros Premium (Segmented Control) */}
          <div className="flex p-1 bg-zinc-900/80 border border-white/5 rounded-lg">
            {(["TODOS", "STUDENT", "RECRUITER"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                  activeFilter === filter
                    ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
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
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium uppercase tracking-widest">Carregando...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 flex flex-col items-center">
              <div className="p-3 bg-zinc-900/50 rounded-full mb-3">
                <FiMessageSquare className="text-2xl opacity-50" />
              </div>
              <span className="text-sm font-medium">Nenhuma conversa.</span>
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
                  className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer border border-transparent hover:border-white/5 transition-all group overflow-hidden"
                >
                  {/* Glow Hover Subtil */}
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Avatar do Contato */}
                  <div className="relative w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-blue-500 shrink-0 shadow-inner">
                    {otherUser.avatarUrl ? (
                      <Image
                        src={otherUser.avatarUrl}
                        alt={otherUser.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      otherUser.name.charAt(0)
                    )}
                    {/* Indicador de Online Fake para Premium Feel */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-950 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  </div>

                  {/* Informações de Texto */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                        {otherUser.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        12:34
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate pr-4">
                      {lastMessage
                        ? lastMessage.content
                        : "Envie uma mensagem para começar..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* COLUNA DA DIREITA: TELA INICIAL (STANDBY) */}
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-950/40 relative text-center">
        {/* Glow Central Background */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-zinc-900 to-black border border-white/5 flex items-center justify-center text-zinc-600 mb-6 shadow-2xl rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-500">
            <FiMessageSquare size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400 mb-2">
            Central de Mensagens ConnectU
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Selecione uma conversa na lista lateral para abrir o chat em tempo real e negociar as melhores oportunidades.
          </p>
        </div>
      </main>
    </div>
  );
}
