"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io } from "socket.io-client";
import {
  FiSend,
  FiMessageSquare,
  FiSearch,
  FiArrowLeft,
  FiMoreVertical,
  FiPhone,
  FiVideo,
  FiSmile,
  FiX,
  FiImage,
  FiMoreHorizontal,
  FiEdit2,
  FiTrash2
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
  content: string | null;
  imageUrl?: string | null;
  isEdited?: boolean;
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    socket.emit("request_online_users");

    socket.on("online_users_list", (usersArray: string[]) => {
      setOnlineUsers(usersArray);
    });

    socket.on("user_status_change", (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => {
        if (data.status === "online") {
          if (!prev.includes(data.userId)) return [...prev, data.userId];
          return prev;
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("message_edited", (updatedMsg: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    });

    socket.on("message_deleted", (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on("room_deleted", (deletedRoomId: string) => {
      if (deletedRoomId === roomId) {
        alert("Esta conversa foi apagada.");
        router.push("/dashboard/chat");
      }
    });

    return () => {
      socket.off("online_users_list");
      socket.off("user_status_change");
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("room_deleted");
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

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || !roomId || isUploading) return;

    if (editingMessageId) {
      socket.emit("edit_message", { 
        messageId: editingMessageId, 
        newContent: newMessage.trim(), 
        roomId 
      });
      setNewMessage("");
      setEditingMessageId(null);
      return;
    }

    let imageUrl = null;

    if (selectedImage) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedImage);

      try {
        const tokenStr = localStorage.getItem("connectu_token");
        const res = await fetch("https://connectu-gd1z.onrender.com/conversations/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenStr}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          imageUrl = data.url;
        } else {
          console.error("Erro ao enviar imagem");
          setIsUploading(false);
          return; // abort message if image fails
        }
      } catch (err) {
        console.error(err);
        setIsUploading(false);
        return;
      }
    }

    const messageData = {
      roomId,
      content: newMessage.trim() || null,
      senderId: user.id,
      imageUrl: imageUrl,
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
    setSelectedImage(null);
    setIsUploading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setNewMessage(msg.content || "");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setNewMessage("");
  };

  const deleteMessage = (msgId: string) => {
    if (confirm("Tem certeza que deseja apagar esta mensagem para todos?")) {
      socket.emit("delete_message", { messageId: msgId, roomId });
    }
  };

  const handleDeleteRoom = () => {
    if (confirm("ATENÇÃO: Deseja apagar esta conversa permanentemente para ambos os usuários?")) {
      socket.emit("delete_room", roomId);
    }
  };

  const handleMute = () => {
    alert("Notificações silenciadas para esta conversa!");
    setIsMenuOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-black text-white overflow-hidden">
      {/* COLUNA DA ESQUERDA: LISTA DE CONVERSAS */}
      <aside className="hidden md:flex w-[400px] border-r border-white/5 bg-zinc-950/80 flex-col h-full shrink-0 relative z-10 backdrop-blur-xl">
        <div className="p-5 border-b border-white/5 space-y-5 bg-linear-to-b from-zinc-900/50 to-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">
              Mensagens
            </h1>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <FiMessageSquare size={16} />
            </div>
          </div>
          
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

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {isListLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                  className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all overflow-hidden group ${
                    isCurrent
                      ? "bg-zinc-900 border-white/10 shadow-inner"
                      : "border-transparent hover:bg-zinc-900 hover:border-white/5"
                  }`}
                >
                  {!isCurrent && (
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}

                  {isCurrent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}

                  <div className="relative w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-blue-500 shrink-0 shadow-inner">
                    {other.avatarUrl ? (
                      <Image
                        src={other.avatarUrl}
                        alt={other.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      other.name.charAt(0)
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-950 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`font-bold text-sm truncate transition-colors ${isCurrent ? "text-white" : "text-zinc-100 group-hover:text-blue-400"}`}>
                        {other.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        12:34
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate pr-4">
                      {room.messages && room.messages[0]
                        ? room.messages[0].content
                        : "Envie uma mensagem para começar..."}
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
        {/* Background Patterns para visual Premium */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950 to-zinc-950 pointer-events-none" />

        {/* Cabeçalho do Chat Ativo (Glassmorphism) */}
        <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between gap-3 backdrop-blur-md bg-zinc-950/70 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/chat")}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <FiArrowLeft size={18} />
            </button>

            <div className="relative w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-blue-400 overflow-hidden shadow-inner">
              {activeChatUser?.avatarUrl ? (
                <Image
                  src={activeChatUser.avatarUrl}
                  alt={activeChatUser.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                activeChatUser?.name.charAt(0) || "?"
              )}
            </div>

            <div>
              <h2 className="font-extrabold text-base text-zinc-100 tracking-tight">
                {activeChatUser?.name || "Carregando..."}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  activeChatUser && onlineUsers.includes(activeChatUser.id)
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
                    : "bg-zinc-600"
                }`}></span>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {activeChatUser?.role === "RECRUITER" ? "Recrutador" : "Candidato"} • {
                    activeChatUser && onlineUsers.includes(activeChatUser.id) ? "Online" : "Offline"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Ações Premium (Mockadas para visual, 3 pontinhos para o futuro) */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Chamada de Áudio (Em breve)">
              <FiPhone size={18} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Chamada de Vídeo (Em breve)">
              <FiVideo size={18} />
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            {/* 3 pontinhos (Reservado para funcionalidades futuras) */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isMenuOpen ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <FiMoreVertical size={18} />
              </button>
              
              {/* Overlay invisível para fechar ao clicar fora */}
              {isMenuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
              )}

              {/* Dropdown mockado que aparece no click */}
              <div className={`absolute right-0 top-full mt-2 flex-col bg-zinc-800/90 backdrop-blur-md rounded-xl p-2 shadow-2xl border border-zinc-700 w-48 z-50 ${
                isMenuOpen ? "flex" : "hidden"
              }`}>
                <button 
                  onClick={() => router.push(activeChatUser ? `/dashboard/perfil/${activeChatUser.id}` : "#")}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Ver Perfil
                </button>
                <button 
                  onClick={handleMute}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Silenciar Notificações
                </button>
                <div className="w-full h-px bg-zinc-700 my-1"></div>
                <button 
                  onClick={handleDeleteRoom}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  Apagar Conversa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {/* Timestamp separador do dia */}
          <div className="flex justify-center mb-8 mt-2">
            <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest backdrop-blur-sm">
              Hoje
            </span>
          </div>

          {messages.map((msg, index) => {
            const isMine = msg.senderId === user?.id;
            const isLastMessageFromSender = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[85%] md:max-w-[70%] px-4 py-3 text-sm shadow-md transition-all flex flex-col group/msg ${
                    isMine
                      ? "bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-blue-600/20"
                      : "bg-zinc-900/90 border border-white/5 text-zinc-200 rounded-2xl rounded-bl-sm backdrop-blur-md"
                  } ${!isLastMessageFromSender && isMine ? "rounded-br-2xl mb-1" : ""} 
                    ${!isLastMessageFromSender && !isMine ? "rounded-bl-2xl mb-1" : ""}`}
                >
                  {/* Menu flutuante de ações da mensagem (Apenas se for o remetente) */}
                  {isMine && (
                    <div className="absolute -left-9 top-1/2 -translate-y-1/2 hidden group-hover/msg:flex flex-col gap-1 bg-zinc-800/90 backdrop-blur-sm rounded-lg p-1 shadow-xl border border-zinc-700 z-10">
                      <button onClick={() => startEditing(msg)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors" title="Editar">
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-md transition-colors" title="Apagar">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div className="mb-2 w-full max-w-[300px] rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                      <Image 
                        src={msg.imageUrl} 
                        alt="Imagem enviada" 
                        width={300} 
                        height={300} 
                        className="w-full h-auto object-cover rounded-xl"
                        unoptimized
                      />
                    </div>
                  )}

                  {msg.content && (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  
                  {/* Tempo da mensagem dentro do balão */}
                  <div className={`text-[10px] flex items-center gap-1 mt-1 font-medium ${isMine ? "text-blue-200 justify-end" : "text-zinc-500 justify-start"}`}>
                    {msg.isEdited && <span className="italic opacity-80 mr-1">(editado)</span>}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Preview de imagem se selecionada */}
        {selectedImage && (
          <div className="px-4 pt-4 pb-0 bg-transparent relative z-20">
            <div className="max-w-4xl mx-auto">
              <div className="relative inline-block bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-xl">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-30"
                >
                  <FiX size={14} />
                </button>
                <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-zinc-950 border border-white/5">
                  <Image 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Preview" 
                    fill 
                    className="object-cover opacity-90"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input de mensagem (Floating Bar Premium) */}
        <div className="p-4 bg-transparent relative z-20 flex flex-col gap-2">
          {editingMessageId && (
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-zinc-900/90 border border-blue-500/30 px-4 py-2 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                <FiEdit2 size={14} />
                <span>Editando mensagem...</span>
              </div>
              <button onClick={cancelEditing} className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors">
                <FiX size={16} />
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto w-full flex items-end gap-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 shrink-0 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <FiImage size={20} />
            </button>
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Escreva sua mensagem..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm py-3 px-2 resize-none outline-none placeholder-zinc-500 min-h-[44px] max-h-32 scrollbar-thin scrollbar-thumb-zinc-700"
            />
            
            <button className="p-3 shrink-0 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors">
              <FiSmile size={20} />
            </button>

            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedImage) || isUploading}
              className="group p-3 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:shadow-none relative overflow-hidden flex items-center justify-center"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin m-0.5"></div>
              ) : (
                <FiSend size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-disabled:translate-x-0 group-disabled:translate-y-0" />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
