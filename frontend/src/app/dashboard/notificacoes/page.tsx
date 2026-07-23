"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiMessageSquare, FiHeart, FiCheck, FiBriefcase, FiUsers, FiInfo, FiChevronDown } from "react-icons/fi";
import { useSocket } from "@/app/components/providers/SocketProvider";
import { apiEndpoint } from "@/lib/api";
import RightSidebar from "../RightSidebar";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  actor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  resourceUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

const FILTER_OPTIONS = [
  { label: "Todas", value: "ALL" },
  { label: "Mensagens", value: "MESSAGE" },
  { label: "Candidaturas", value: "APPLICATION" },
  { label: "Vagas", value: "JOB" },
  { label: "Interações", value: "LIKE,COMMENT,CONNECTION" },
  { label: "Sistema", value: "SYSTEM" }
];

export default function NotificationsPage() {
  const router = useRouter();
  const { socket } = useSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (cursor?: string | null, reset = false) => {
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    if (reset) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (cursor) params.append("cursor", cursor);
      if (activeTab === "UNREAD") params.append("unread", "true");
      if (activeFilter !== "ALL") params.append("types", activeFilter);

      const res = await fetch(apiEndpoint(`/notifications?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Falha ao buscar notificações");

      const data = await res.json();
      
      setNotifications(prev => {
        if (reset) return data.items;
        
        // Deduplicate
        const newIds = new Set(data.items.map((n: Notification) => n.id));
        const filteredPrev = prev.filter(n => !newIds.has(n.id));
        return [...filteredPrev, ...data.items];
      });
      
      setNextCursor(data.nextCursor);
      setGlobalUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
      if (reset) setError("Não foi possível carregar suas notificações.");
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [activeTab, activeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications(null, true);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (newNotification: Notification) => {
      setGlobalUnreadCount(prev => prev + 1);

      // Check if it matches current tab/filter
      if (activeTab === "UNREAD" && newNotification.read) return;
      if (activeFilter !== "ALL") {
        const allowedTypes = activeFilter.split(",");
        if (!allowedTypes.includes(newNotification.type)) return;
      }

      setNotifications((current) => {
        const duplicated = current.some((item) => item.id === newNotification.id);
        if (duplicated) return current;
        return [newNotification, ...current];
      });
    };

    const handleRoomRead = (data: { roomId: string, resourceUrl?: string }) => {
      setNotifications((current) => {
        let changed = false;
        const mapped = current.map(n => {
          if (n.type === "MESSAGE" && !n.read && (n.metadata?.roomId === data.roomId || n.resourceUrl === `/dashboard/chat/${data.roomId}`)) {
            changed = true;
            return { ...n, read: true };
          }
          return n;
        });
        
        if (changed) {
          const markedCount = current.filter(n => n.type === "MESSAGE" && !n.read && (n.metadata?.roomId === data.roomId || n.resourceUrl === `/dashboard/chat/${data.roomId}`)).length;
          setGlobalUnreadCount(prev => Math.max(0, prev - markedCount));
          
          if (activeTab === "UNREAD") {
            return mapped.filter(n => !n.read);
          }
        }
        return mapped;
      });
    };

    const handleAllRead = () => {
      setNotifications((current) => {
        if (activeTab === "UNREAD") return [];
        return current.map((notification) => ({ ...notification, read: true }));
      });
      setGlobalUnreadCount(0);
    };

    const handleSingleRead = (data: { notificationId: string }) => {
      setNotifications((current) => {
        const index = current.findIndex(n => n.id === data.notificationId);
        if (index === -1) return current;
        if (current[index].read) return current;
        
        setGlobalUnreadCount(prev => Math.max(0, prev - 1));
        
        if (activeTab === "UNREAD") {
          return current.filter(n => n.id !== data.notificationId);
        }
        
        const newArr = [...current];
        newArr[index] = { ...newArr[index], read: true };
        return newArr;
      });
    };

    socket.on("notification:received", handleNotification);
    socket.on("notifications:room-read", handleRoomRead);
    socket.on("notifications:all-read", handleAllRead);
    socket.on("notification:read", handleSingleRead);

    return () => {
      socket.off("notification:received", handleNotification);
      socket.off("notifications:room-read", handleRoomRead);
      socket.off("notifications:all-read", handleAllRead);
      socket.off("notification:read", handleSingleRead);
    };
  }, [socket, activeTab, activeFilter]);

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    // Optimistic update
    setNotifications((current) => {
      if (activeTab === "UNREAD") return [];
      return current.map(n => ({ ...n, read: true }));
    });
    setGlobalUnreadCount(0);

    try {
      const res = await fetch(apiEndpoint("/notifications/read-all"), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao marcar");
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      // Optimistic
      setNotifications((current) => {
        if (activeTab === "UNREAD") return current.filter(n => n.id !== notification.id);
        return current.map(n => n.id === notification.id ? { ...n, read: true } : n);
      });
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));

      const token = localStorage.getItem("connectu_token");
      fetch(apiEndpoint(`/notifications/${notification.id}/read`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error("Erro ao marcar como lida:", err));
    }

    if (notification.resourceUrl && notification.resourceUrl.startsWith("/dashboard/")) {
      router.push(notification.resourceUrl);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <FiHeart className="text-red-500" />;
      case "COMMENT": return <FiMessageSquare className="text-blue-500" />;
      case "MESSAGE": return <FiMessageSquare className="text-emerald-500" />;
      case "CONNECTION": return <FiUsers className="text-purple-500" />;
      case "APPLICATION": return <FiBriefcase className="text-orange-500" />;
      case "JOB": return <FiBriefcase className="text-blue-400" />;
      case "SYSTEM": return <FiInfo className="text-zinc-400" />;
      default: return <FiBell className="text-zinc-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffMins = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `Há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours} h`;
    return date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  };

  const groupByDate = (notifs: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const week: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStr = now.toLocaleDateString("pt-BR");
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString("pt-BR");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    notifs.forEach((n) => {
      const d = new Date(n.createdAt);
      const dStr = d.toLocaleDateString("pt-BR");
      
      if (dStr === todayStr) {
        today.push(n);
      } else if (dStr === yesterdayStr) {
        yesterday.push(n);
      } else if (d >= sevenDaysAgo) {
        week.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, week, older };
  };

  const grouped = groupByDate(notifications);

  const renderNotificationGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-body-md font-bold text-on-surface-variant mb-4 px-2">{title}</h3>
        <div className="flex flex-col gap-2">
          {items.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left p-4 rounded-xl flex gap-4 transition-all hover:bg-surface-variant cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary ${!notification.read ? "bg-primary/5 border border-primary/20" : "border border-outline-variant/30"}`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-surface-container-high text-primary relative">
                {notification.actor?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={notification.actor.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg">{notification.actor?.name?.charAt(0) || getIcon(notification.type)}</span>
                )}
                {notification.actor?.avatarUrl && (
                  <div className="absolute bottom-0 right-0 bg-surface-container-low border border-outline-variant rounded-full p-1 text-[10px] shadow-sm">
                    {getIcon(notification.type)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex min-w-0 items-start gap-3">
                  <p className={`min-w-0 flex-1 truncate text-body-md ${!notification.read ? "font-bold text-on-surface" : "text-on-surface"}`}>
                     {notification.type === "MESSAGE" 
                        ? (notification.actor?.name ? `${notification.actor.name} enviou uma nova mensagem` : "Nova mensagem") 
                        : (notification.title.includes("undefined") ? "Nova notificação" : notification.title)
                     }
                  </p>
                  <time className="shrink-0 text-on-surface-variant text-[12px] whitespace-nowrap pt-0.5">
                     {formatTime(notification.createdAt)}
                  </time>
                </div>
                <p className={`text-body-sm line-clamp-2 mt-1 ${!notification.read ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {notification.description}
                </p>
              </div>
              {!notification.read && (
                <div className="flex items-center justify-end shrink-0 pl-2">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="lg:mr-80 flex flex-col items-center w-full min-w-0 max-w-full">
        <div className="mx-auto w-full min-w-0 max-w-[900px] space-y-[20px] px-4 sm:px-0">
          
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-4 sm:py-6">
            <div>
              <h1 className="text-display-sm font-black text-on-surface">Notificações</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Acompanhe mensagens, candidaturas e atualizações da sua conta.</p>
            </div>
            
            <button 
              onClick={handleMarkAllAsRead}
              disabled={globalUnreadCount === 0}
              className="shrink-0 flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-variant text-primary px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              aria-label="Marcar todas as notificações como lidas"
            >
              <FiCheck className="text-lg" />
              Marcar todas como lidas
            </button>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex items-center border-b border-outline-variant/50 w-full">
              <button 
                onClick={() => setActiveTab("ALL")}
                className={`flex-1 sm:flex-none px-6 py-3 font-bold transition-all border-b-2 ${activeTab === "ALL" ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"}`}
                aria-current={activeTab === "ALL" ? "page" : undefined}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveTab("UNREAD")}
                className={`flex-1 sm:flex-none px-6 py-3 font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === "UNREAD" ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"}`}
                aria-current={activeTab === "UNREAD" ? "page" : undefined}
              >
                Não lidas
                {globalUnreadCount > 0 && (
                  <span className="bg-primary/20 text-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{globalUnreadCount}</span>
                )}
              </button>
            </div>

            {/* Type Filters - Rolável no mobile */}
            <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2 w-full min-w-0">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFilter === opt.value ? "bg-primary text-on-primary" : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Content */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 sm:p-6 w-full min-w-0 max-w-full">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(n => (
                  <div key={n} className="flex gap-4 p-4 rounded-xl animate-pulse">
                     <div className="w-12 h-12 bg-surface-container-high rounded-full shrink-0"></div>
                     <div className="flex-1 space-y-2 py-1">
                       <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
                       <div className="h-3 bg-surface-container-high rounded w-2/3"></div>
                     </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center flex flex-col items-center">
                <FiBell className="text-4xl text-on-surface-variant/30 mb-4" />
                <p className="text-on-surface-variant font-medium mb-4">{error}</p>
                <button onClick={() => fetchNotifications(null, true)} className="text-primary hover:underline font-bold">
                  Tentar novamente
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <FiBell className="text-4xl text-on-surface-variant/30 mb-4 mx-auto" />
                <p className="text-on-surface-variant font-medium">
                  {activeTab === "UNREAD" ? "Você está em dia com suas notificações." 
                   : activeFilter !== "ALL" ? "Nenhuma notificação encontrada neste filtro." 
                   : "Você ainda não possui notificações."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full min-w-0">
                {renderNotificationGroup("Hoje", grouped.today)}
                {renderNotificationGroup("Ontem", grouped.yesterday)}
                {renderNotificationGroup("Últimos 7 dias", grouped.week)}
                {renderNotificationGroup("Anteriores", grouped.older)}

                {nextCursor && (
                  <div className="mt-8 mb-4 text-center">
                    <button 
                      onClick={() => fetchNotifications(nextCursor)}
                      disabled={isFetchingMore}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-full font-bold transition-colors disabled:opacity-50"
                    >
                      {isFetchingMore ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiChevronDown />
                      )}
                      {isFetchingMore ? "Carregando..." : "Carregar mais"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <RightSidebar />
    </>
  );
}
