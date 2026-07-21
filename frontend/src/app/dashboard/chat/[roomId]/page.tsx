"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiSend,
  FiMessageSquare,
  FiArrowLeft,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiSmile,
  FiUser,
  FiSidebar,
  FiCheck,
  FiCheckCircle,
  FiVolume2,
  FiVolumeX,
  FiEyeOff,
  FiPlusCircle,
  FiBriefcase,
  FiUsers
} from "react-icons/fi";
import type { Participant, Room } from "../layout";
import { useUnreadMessages } from "../../../components/providers/UnreadMessagesProvider";
import { MessageStatus, MessageDeliveryStatus } from "../../../components/chat/MessageStatus";
import { useSocket } from "../../../components/providers/SocketProvider";
import { API_URL } from "../../../../lib/api";

interface Message {
  id: string;
  content: string | null;
  imageUrl?: string | null;
  isEdited?: boolean;
  senderId: string;
  createdAt: string;
  deliveryStatus?: MessageDeliveryStatus;
  deliveredAt?: string | null;
  readAt?: string | null;
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
  const { unreadByRoom, markRoomAsRead } = useUnreadMessages();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeChatUser, setActiveChatUser] = useState<Participant | null>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("connectu_conversations_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        const currentRoom = parsed.find((r: Room) => r.id === roomId);
        if (currentRoom && currentRoom.users[0]) return currentRoom.users[0];
      }
    }
    return null;
  });

  const [user] = useState<UserData | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("connectu_user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchActiveUser() {
      if (activeChatUser) return;
      try {
        const tokenStr = localStorage.getItem("connectu_token");
        const res = await fetch(`${API_URL}/conversations`, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenStr}` },
        });

        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem("connectu_conversations_cache", JSON.stringify(data));
          const currentRoom = data.find((r: Room) => r.id === roomId);
          if (currentRoom && currentRoom.users[0]) {
            setActiveChatUser(currentRoom.users[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar conversas:", error);
      }
    }
    fetchActiveUser();
  }, [roomId, activeChatUser]);

  // Lógica Socket.io 
  useEffect(() => {
    if (!socket) return;

    if (roomId) {
      socket.emit("join_room", roomId);
    }
    
    socket.emit("request_online_users");

    const onOnlineUsersList = (usersArray: string[]) => {
      setOnlineUsers(usersArray);
    };

    const onUserStatusChange = (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => {
        if (data.status === "online") {
          if (!prev.includes(data.userId)) return [...prev, data.userId];
          return prev;
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    };

    const onReceiveMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onMessageReceiptUpdated = (data: { messageId: string, deliveredAt: string, readAt: string | null }) => {
      setMessages((prev) => prev.map(m => {
        if (m.id === data.messageId) {
          const newStatus = data.readAt ? "READ" : "DELIVERED";
          return {
            ...m,
            deliveryStatus: newStatus,
            deliveredAt: data.deliveredAt || m.deliveredAt,
            readAt: data.readAt || m.readAt
          };
        }
        return m;
      }));
    };

    const onMessagesReadUpTo = (data: { roomId: string, readThroughAt: string }) => {
      if (data.roomId !== roomId) return;
      const readLimit = new Date(data.readThroughAt).getTime();
      setMessages((prev) => prev.map(m => {
        // Se a mensagem for anterior ou igual ao readThroughAt
        if (new Date(m.createdAt).getTime() <= readLimit && m.senderId === user?.id) {
          return {
            ...m,
            deliveryStatus: "READ",
            readAt: data.readThroughAt
          };
        }
        return m;
      }));
    };

    const onMessageEdited = (updatedMsg: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const onRoomDeleted = (deletedRoomId: string) => {
      if (deletedRoomId === roomId) {
        alert("Esta conversa foi apagada.");
        router.push("/dashboard/chat");
      }
    };

    socket.on("online_users_list", onOnlineUsersList);
    socket.on("user_status_change", onUserStatusChange);
    socket.on("receive_message", onReceiveMessage);
    socket.on("message:receipt-updated", onMessageReceiptUpdated);
    socket.on("messages:read-up-to", onMessagesReadUpTo);
    socket.on("message_edited", onMessageEdited);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("room_deleted", onRoomDeleted);

    return () => {
      socket.off("online_users_list", onOnlineUsersList);
      socket.off("user_status_change", onUserStatusChange);
      socket.off("receive_message", onReceiveMessage);
      socket.off("message:receipt-updated", onMessageReceiptUpdated);
      socket.off("messages:read-up-to", onMessagesReadUpTo);
      socket.off("message_edited", onMessageEdited);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("room_deleted", onRoomDeleted);
    };
  }, [roomId, router, socket]);

  useEffect(() => {
    // Carrega o estado de mute atual
    if (typeof window !== "undefined" && roomId) {
      setTimeout(() => {
        const mutedRooms = JSON.parse(localStorage.getItem("connectu_muted_rooms") || "[]");
        setIsMuted(mutedRooms.includes(roomId));
      }, 0);
    }
  }, [roomId]);

  // Buscar histórico de mensagens da sala ativa
  useEffect(() => {
    async function fetchMessages() {
      if (!roomId) return;
      try {
        const tokenStr = localStorage.getItem("connectu_token");
        const res = await fetch(
          `${API_URL}/conversations/${roomId}/messages`,
          {
            headers: { Authorization: `Bearer ${tokenStr}` },
          }
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


  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lógica Otimizada de Leitura Automática com Debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAndMark = () => {
      const isVisibleAndFocused = document.visibilityState === "visible" && document.hasFocus();
      const hasUnread = unreadByRoom[roomId as string] > 0;

      if (hasUnread && isVisibleAndFocused) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          markRoomAsRead(roomId as string);
        }, 500);
      }
    };

    checkAndMark();

    window.addEventListener("focus", checkAndMark);
    document.addEventListener("visibilitychange", checkAndMark);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("focus", checkAndMark);
      document.removeEventListener("visibilitychange", checkAndMark);
    };
  }, [roomId, unreadByRoom, markRoomAsRead, messages]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || !roomId || isUploading || !socket) return;

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
        const res = await fetch(`${API_URL}/conversations/upload-image`, {
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
          return; 
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
      socket?.emit("delete_message", { messageId: msgId, roomId });
    }
  };

  const handleMute = () => {
    socket?.emit("toggle_mute_room", roomId);
    const mutedRooms = JSON.parse(localStorage.getItem("connectu_muted_rooms") || "[]");
    
    if (isMuted) {
      const updatedRooms = mutedRooms.filter((id: string) => id !== roomId);
      localStorage.setItem("connectu_muted_rooms", JSON.stringify(updatedRooms));
      setIsMuted(false);
    } else {
      mutedRooms.push(roomId);
      localStorage.setItem("connectu_muted_rooms", JSON.stringify(mutedRooms));
      setIsMuted(true);
    }
    setIsMenuOpen(false);
  };

  const isOnline = activeChatUser ? onlineUsers.includes(activeChatUser.id) : false;

  return (
    <>
      {/* Column 2: Central Chat (600-650px) */}
      <main className="w-full lg:flex-1 lg:w-auto min-h-0 flex flex-col bg-surface relative border-r border-outline-variant min-w-0">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-md border-b border-outline-variant bg-surface/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-md min-w-0">
            <button onClick={() => router.push('/dashboard/chat')} className="lg:hidden shrink-0 p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
              <FiArrowLeft size={20} />
            </button>
            <div className="relative">
              {activeChatUser?.avatarUrl ? (
                <Image
                  src={activeChatUser.avatarUrl}
                  alt={activeChatUser.name}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                  {activeChatUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-surface rounded-full ${isOnline ? "bg-[#10B981]" : "bg-gray-500"}`}></div>
            </div>
            <div>
              <h3 className="font-bold text-on-surface leading-none text-[15px]">{activeChatUser?.name || "Usuário"}</h3>
              <p className="text-[12px] text-on-surface-variant mt-1">
                {activeChatUser?.role === "RECRUITER" ? "Recrutador" : "Aluno(a)"} · <span className={isOnline ? "text-[#10B981] font-medium" : "text-gray-400 font-medium"}>{isOnline ? "Disponível agora" : "Offline"}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-xs">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Ver Perfil">
              <FiUser size={20} />
            </button>
            <button className="hidden xl:block p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Alternar Painel">
              <FiSidebar size={20} />
            </button>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                <FiMoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  <button onClick={handleMute} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-2">
                    {isMuted ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
                    {isMuted ? "Desativar Mudo" : "Silenciar"}
                  </button>
                  <button onClick={() => { setIsMenuOpen(false); alert("Ocultar não implementado"); }} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-2">
                    <FiEyeOff size={18} />
                    Ocultar Conversa
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-lg space-y-md custom-scrollbar">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-70">
              <FiMessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-xs">Comece a conversa com {activeChatUser?.name}!</p>
            </div>
          ) : (
            <>
              {activeChatUser?.role === "RECRUITER" && (
                <div className="flex justify-center py-sm mb-4">
                  <div className="flex items-center gap-xs px-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-full">
                    <FiCheckCircle className="text-primary" size={16} />
                    <p className="text-[12px] font-medium text-on-surface-variant">
                      Candidatura enviada · <span className="text-primary font-bold">87% de Match</span>
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
              const isMine = msg.senderId === user?.id;
              const showAvatar = !isMine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
              
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                  <div className={`flex gap-sm max-w-[85%] ${isMine ? "" : (showAvatar ? "" : "ml-10")}`}>
                    {!isMine && showAvatar && (
                      <div className="shrink-0 self-end mb-1">
                         {activeChatUser?.avatarUrl ? (
                            <Image
                              src={activeChatUser.avatarUrl}
                              alt="Avatar"
                              width={32}
                              height={32}
                              unoptimized
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary text-xs">
                              {activeChatUser?.name?.charAt(0) || "U"}
                            </div>
                          )}
                      </div>
                    )}
                    
                    <div className="relative group/msg">
                      <div className={`${isMine ? "bg-primary text-white rounded-br-none shadow-md" : "bg-surface-container-high text-on-surface rounded-bl-none shadow-sm border border-outline-variant"} p-3 rounded-2xl`}>
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                            <Image src={msg.imageUrl} alt="Imagem enviada" width={300} height={200} className="object-cover max-w-full h-auto" unoptimized />
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>

                      {/* Msg Actions */}
                      {isMine && (
                        <div className="absolute top-1/2 -translate-y-1/2 -left-16 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 bg-surface-container-high rounded-full px-2 py-1 shadow-md border border-outline-variant">
                          <button onClick={() => startEditing(msg)} className="text-on-surface-variant hover:text-primary p-1" title="Editar">
                            <FiEdit2 size={12} />
                          </button>
                          <button onClick={() => deleteMessage(msg.id)} className="text-on-surface-variant hover:text-red-500 p-1" title="Apagar">
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "justify-end" : "justify-start ml-10"}`}>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isEdited && " (Editado)"}
                    </span>
                    {isMine && <MessageStatus status={msg.deliveryStatus} deliveredAt={msg.deliveredAt} readAt={msg.readAt} />}
                  </div>
                </div>
              );
            })}
            </>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Composer */}
        <div className="p-md pb-[max(12px,env(safe-area-inset-bottom))] bg-surface border-t border-outline-variant shrink-0 w-full">
          
          {editingMessageId && (
            <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg mb-2 border border-primary/30">
              <span className="text-xs text-on-surface-variant font-medium flex items-center gap-2">
                <FiEdit2 className="text-primary" /> Editando mensagem...
              </span>
              <button onClick={cancelEditing} className="text-on-surface-variant hover:text-white">
                <FiX size={14} />
              </button>
            </div>
          )}
          
          {selectedImage && (
             <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg mb-2 border border-outline-variant">
                <span className="text-xs text-on-surface-variant flex items-center gap-2">
                  <FiImage className="text-primary" /> {selectedImage.name}
                </span>
                <button onClick={() => setSelectedImage(null)} className="text-on-surface-variant hover:text-red-500">
                  <FiX size={14} />
                </button>
             </div>
          )}

          <div className="bg-surface-container-low border border-outline-variant rounded-xl px-2 py-1 flex items-center gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all min-h-12">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-on-surface-variant hover:text-primary transition-colors">
              <FiPlusCircle size={20} />
            </button>
            
            <textarea
              className="min-w-0 flex-1 resize-none bg-transparent py-2 leading-5 outline-none custom-scrollbar placeholder:text-on-surface-variant/50 text-[14px]"
              placeholder={isMuted ? "Você silenciou as notificações desta conversa..." : "Escreva uma mensagem..."}
              value={newMessage}
              rows={1}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  e.currentTarget.style.height = "auto";
                }
              }}
            />
            
            <div className="flex items-center gap-1 self-end mb-1">
              <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-on-surface-variant hover:text-primary transition-colors">
                <FiSmile size={20} />
              </button>
              <button
                onClick={() => {
                   sendMessage();
                   if (document.querySelector('textarea')) (document.querySelector('textarea') as HTMLTextAreaElement).style.height = "auto";
                }}
                disabled={isUploading || (!newMessage.trim() && !selectedImage)}
                className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center hover:brightness-110 shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSend size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Column 3: Context Panel (300-320px) */}
      <aside className="hidden lg:flex min-h-0 w-77.5 bg-surface-container-low overflow-y-auto custom-scrollbar shrink-0 flex-col border-l border-outline-variant">
        <div className="p-lg flex flex-col gap-lg">
          
          {/* Identity Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-md">
              {activeChatUser?.avatarUrl ? (
                <Image
                  src={activeChatUser.avatarUrl}
                  alt={activeChatUser.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-surface-container shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-full ring-4 ring-surface-container shadow-xl bg-surface-container-highest flex items-center justify-center font-bold text-primary text-2xl">
                  {activeChatUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <div className={`absolute bottom-1 right-1 w-4 h-4 border-[3px] border-surface-container-low rounded-full ${isOnline ? "bg-[#10B981]" : "bg-gray-500"}`}></div>
            </div>
            
            <h2 className="text-[17px] font-bold text-on-surface">{activeChatUser?.name || "Usuário"}</h2>
            <p className="text-[13px] text-on-surface-variant">
               {activeChatUser?.role === "RECRUITER" ? "Tech Recruiter" : "Aluno(a)"}
            </p>
            
            {activeChatUser?.role === "RECRUITER" && (
              <div className="mt-2 flex items-center gap-xs px-2 py-0.5 bg-surface-container-highest rounded text-[11px] font-bold text-primary uppercase tracking-wider">
                <FiCheckCircle size={14} className="mr-1" />
                Recrutador Verificado
              </div>
            )}
            
            <button className="w-full mt-lg py-2.5 bg-surface-container-highest border border-outline-variant rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-bright transition-colors">
              Ver perfil completo
            </button>
          </div>
          
          <div className="h-px bg-outline-variant w-full"></div>
          
          {/* Match & Status Section */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                 {activeChatUser?.role === "RECRUITER" ? "Vaga Relacionada" : "Sobre o Aluno"}
              </h4>
              <span className="text-[11px] font-bold text-primary cursor-pointer hover:underline">Ver todas</span>
            </div>
            
            <div className="p-3 bg-surface-container border border-outline-variant rounded-xl group hover:border-primary transition-colors cursor-pointer shadow-sm">
              <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors text-[14px]">
                 {activeChatUser?.role === "RECRUITER" ? "Desenvolvedor Front-end Júnior" : "Full Stack Pleno"}
              </h5>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                 {activeChatUser?.role === "RECRUITER" ? "TechSolutions · São Paulo" : "Disponível para trabalho"}
              </p>
              
              <div className="flex flex-wrap gap-xs mt-3">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">87% Match</span>
                <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded">
                  {activeChatUser?.role === "RECRUITER" ? "Remoto · CLT" : "Remoto"}
                </span>
              </div>
            </div>

            {/* Status Block */}
            {activeChatUser?.role === "RECRUITER" && (
              <div className="p-3 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-between mt-2">
                <span className="text-[12px] font-medium text-on-surface">Status da candidatura</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">
                  Em análise
                </span>
              </div>
            )}
          </div>

          {/* Company Info (Placeholder) */}
          {activeChatUser?.role === "RECRUITER" && (
            <div className="space-y-sm mt-2">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Sobre a empresa</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-md">
                  <FiBriefcase className="text-on-surface-variant" size={18} />
                  <span className="text-[13px] text-on-surface">TechSolutions, SaaS · São Paulo</span>
                </div>
                <div className="flex items-center gap-md">
                  <FiUsers className="text-on-surface-variant" size={18} />
                  <span className="text-[13px] text-on-surface">250 - 500 colaboradores</span>
                </div>
              </div>
            </div>
          )}

          {/* Final Actions */}
          <div className="flex flex-col gap-sm mt-auto pt-md pb-md">
            <button className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
               {activeChatUser?.role === "RECRUITER" ? "Ver detalhes da vaga" : "Convidar para vaga"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
