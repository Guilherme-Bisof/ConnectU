"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { FiMessageSquare, FiSearch, FiEdit3 } from "react-icons/fi";
import { useUnreadMessages } from "../../components/providers/UnreadMessagesProvider";
import { useSocket } from "../../components/providers/SocketProvider";
import { apiEndpoint } from "@/lib/api";

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface MessagePreview {
  content: string;
  createdAt: string;
}

export interface Room {
  id: string;
  context: string;
  users: Participant[];
  messages: MessagePreview[];
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const activeRoomId = params?.roomId as string | undefined;
  const { unreadByRoom, markRoomAsRead } = useUnreadMessages();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Room[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "TODOS" | "STUDENT" | "RECRUITER"
  >("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("request_online_users");

    const handleOnlineUsersList = (usersArray: string[]) => {
      setOnlineUsers(usersArray);
    };

    const handleUserStatusChange = (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => {
        if (data.status === "online") {
          if (!prev.includes(data.userId)) return [...prev, data.userId];
          return prev;
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    };

    socket.on("online_users_list", handleOnlineUsersList);
    socket.on("user_status_change", handleUserStatusChange);

    return () => {
      socket.off("online_users_list", handleOnlineUsersList);
      socket.off("user_status_change", handleUserStatusChange);
    };
  }, [socket]);

  // Buscar conversas do usuário logado
  useEffect(() => {
    async function fetchConversations() {
      try {
        const token = localStorage.getItem("connectu_token");
        const res = await fetch(apiEndpoint("/conversations"), {
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

  const isRoomActive = !!activeRoomId;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background text-on-surface">
      
      {/* Column 1: Conversation List (280-300px) */}
      <section className={`${isRoomActive ? 'hidden lg:flex' : 'flex w-full'} lg:w-[290px] min-h-0 flex-col bg-surface-container border-r border-outline-variant shrink-0`}>
        <div className="p-md space-y-md shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-headline-sm text-on-surface">Mensagens</h2>
            <span className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
              <FiEdit3 size={20} />
            </span>
          </div>
          
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <FiSearch size={16} />
            </span>
            <input
              type="text"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-1.5 pl-9 pr-4 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/60 outline-none"
              placeholder="Pesquisar mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Segmented Control */}
          <div className="flex items-center p-0.5 bg-surface-container-low rounded-lg border border-outline-variant">
            {(["TODOS", "STUDENT", "RECRUITER"] as const).map((filter, idx) => (
              <div key={filter} className="flex-1 flex items-center">
                <button
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider transition-colors ${
                    activeFilter === filter
                      ? "bg-surface-container-highest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {filter === "TODOS"
                    ? "Todos"
                    : filter === "STUDENT"
                      ? "Alunos"
                      : "Recrutadores"}
                </button>
                {idx !== 2 && <span className="text-outline-variant/50 text-[10px] mx-0.5">|</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium uppercase tracking-widest">Carregando...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant flex flex-col items-center">
              <FiMessageSquare className="text-4xl opacity-50 mb-3" />
              <span className="text-sm font-medium">Nenhuma conversa.</span>
            </div>
          ) : (
            filteredConversations.map((room) => {
              const otherUser = room.users[0];
              const lastMessage = room.messages && room.messages[0];

              if (!otherUser) return null;

              const isOnline = onlineUsers.includes(otherUser.id);
              const isActive = activeRoomId === room.id;
              const unreadCount = unreadByRoom[room.id] || 0;

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    if (unreadCount > 0) markRoomAsRead(room.id);
                    router.push(`/dashboard/chat/${room.id}`);
                  }}
                  className={`px-3 py-3 cursor-pointer transition-colors border-l-2 ${
                    isActive 
                      ? "bg-surface-container-highest border-primary shadow-inner" 
                      : "border-transparent hover:bg-surface-container-highest/50"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative shrink-0 mt-0.5">
                      {otherUser.avatarUrl ? (
                        <Image
                          src={otherUser.avatarUrl}
                          alt={otherUser.name}
                          width={44}
                          height={44}
                          unoptimized
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                          {otherUser.name.charAt(0)}
                        </div>
                      )}
                      
                      {/* Status indicator */}
                      <div className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container ${isOnline ? "bg-[#10B981]" : "bg-gray-500"}`}></div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className={`min-w-0 truncate text-[14px] ${isActive ? "font-bold text-white" : (unreadCount > 0 ? "font-bold text-on-surface" : "font-semibold text-on-surface")}`}>
                          {otherUser.name}
                        </span>
                        <time className={`shrink-0 text-[10px] font-bold tracking-wider ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                          {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </time>
                      </div>
                      <p className={`text-[11px] font-medium truncate mb-0.5 ${isActive ? "text-primary/80" : "text-on-surface-variant"}`}>
                        {otherUser.role === "RECRUITER" ? "Recrutador" : "Aluno(a)"}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-[13px] truncate ${isActive ? "text-on-surface" : (unreadCount > 0 ? "text-on-surface font-medium" : "text-on-surface-variant")}`}>
                          {lastMessage ? lastMessage.content : "Envie uma mensagem..."}
                        </p>
                        {unreadCount > 0 && !isActive && (
                          <span className="shrink-0 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Column 2 & 3: Chat and Context area (Children) */}
      <section className={`flex-1 min-w-0 min-h-0 overflow-hidden ${isRoomActive ? 'flex' : 'hidden lg:flex'}`}>
        {children}
      </section>

    </div>
  );
}
