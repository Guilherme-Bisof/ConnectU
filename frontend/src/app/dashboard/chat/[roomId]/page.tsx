"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io } from "socket.io-client";
import {
  FiSend,
  FiPaperclip,
  FiMessageSquare,
  FiSearch,
  FiArrowLeft,
} from "react-icons/fi";

const token =
  typeof window !== "undefined" ? localStorage.getItem("connectu_token") : "";

const socket = io("https://connectu-gd1z.onrender.com", {
  auth: {
    token: token,
  },
  autoConnect: true,
  transports: ["websocket"],
  withCredentials: true
});

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Room {
  id: string;
  context: string;
  users: Participant[];
  messages: Message[];
}

interface UserData {
  id: string;
  name: string;
  role: string;
  companyId?: string;
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Room[]>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("connectu_conversations_cache");
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });

  const [activeFilter, setActiveFilter] = useState<
    "TODOS" | "STUDENT" | "RECRUITER"
  >("TODOS");
  const [searchQuery, setSearchQuery] = useState("");

  const [isListLoading, setIsListLoading] = useState(
    conversations.length === 0,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [activeChatUser, setActiveChatUser] = useState<Participant | null>(
    () => {
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("connectu_conversations_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          const currentRoom = parsed.find((r: Room) => r.id === roomId);
          if (currentRoom && currentRoom.users[0]) return currentRoom.users[0];
        }
      }
      return null;
    },
  );

  const [user] = useState<UserData | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("connectu_user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Buscar a lista de conversas
  useEffect(() => {
    async function fetchConversations() {
      try {
        const tokenStr = localStorage.getItem("connectu_token");
        const res = await fetch(
          "https://connectu-gd1z.onrender.com/conversations",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${tokenStr}` },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setConversations(data);

          sessionStorage.setItem(
            "connectu_conversations_cache",
            JSON.stringify(data),
          );

          const currentRoom = data.find((r: Room) => r.id === roomId);
          if (currentRoom && currentRoom.users[0]) {
            setActiveChatUser(currentRoom.users[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar conversas:", error);
      } finally {
        setIsListLoading(false);
      }
    }

    fetchConversations();
  }, [roomId]);

  // Filtro derivado
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

  // Lógica Socket.io 
  useEffect(() => {
    if (roomId) {
      socket.emit("join_room", roomId);
    }

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [roomId]);

  // Buscar histórico de mensagens da sala ativa
  useEffect(() => {
    async function fetchMessages() {
      if (!roomId) return;
      try {
        const tokenStr = localStorage.getItem("connectu_token");
        const res = await fetch(
          `https://connectu-gd1z.onrender.com/conversations/${roomId}/messages`,
          {
            headers: { Authorization: `Bearer ${tokenStr}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    }
    fetchMessages();
  }, [roomId]);

  // Scroll automático para o fim
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user || !roomId) return;

    const messageData = {
      roomId,
      content: newMessage,
      senderId: user.id,
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-zinc-950 text-white overflow-hidden">
      {/* COLUNA DA ESQUERDA: LISTA DE CONVERSAS */}
      <aside className="hidden md:flex w-96 border-r border-zinc-800 bg-zinc-900/50 flex-col h-full shrink-0">
        <div className="p-4 border-b border-zinc-800 space-y-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FiMessageSquare className="text-blue-500" /> Mensagens
          </h1>
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
          <div className="flex gap-2">
            {(["TODOS", "STUDENT", "RECRUITER"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  activeFilter === filter
                    ? "bg-blue-600 border-blue-500 text-white shadow-md"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isListLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            filteredConversations.map((room) => {
              const other = room.users[0];
              if (!other) return null;
              const isCurrent = room.id === roomId;

              return (
                <div
                  key={room.id}
                  onClick={() => router.push(`/dashboard/chat/${room.id}`)}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                    isCurrent
                      ? "bg-zinc-800 border-zinc-700 shadow-inner"
                      : "border-transparent hover:bg-zinc-800/40 hover:border-zinc-800"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-blue-500 shrink-0 overflow-hidden">
                    {other.avatarUrl ? (
                      <Image
                        src={other.avatarUrl}
                        alt={other.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      other.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`font-semibold text-sm truncate transition-colors ${isCurrent ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                        {other.name}
                      </h4>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 font-bold ${
                          other.role === "RECRUITER"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {other.role === "RECRUITER"
                          ? "Recrutador"
                          : "Aluno"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {room.messages && room.messages[0]
                        ? room.messages[0].content
                        : "Nenhuma mensagem ainda..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* COLUNA DA DIREITA: CHAT ATIVO */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 relative">
        {/* Cabeçalho do Chat Ativo */}
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center gap-3 backdrop-blur-sm sticky top-0 z-10">
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <FiArrowLeft size={20} />
          </button>

          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-blue-400 overflow-hidden">
            {activeChatUser?.avatarUrl ? (
              <Image
                src={activeChatUser.avatarUrl}
                alt={activeChatUser.name}
                width={40}
                height={40}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              activeChatUser?.name.charAt(0) || "?"
            )}
          </div>

          <div>
            <h2 className="font-bold text-sm text-zinc-100">
              {activeChatUser?.name || "..."}
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {activeChatUser?.role === "RECRUITER" ? "Recrutador" : "Aluno"}
            </p>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                  msg.senderId === user?.id
                    ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input de mensagem */}
        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800 flex items-center gap-3 backdrop-blur-sm">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <FiPaperclip size={18} />
          </button>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-95"
          >
            <FiSend size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
