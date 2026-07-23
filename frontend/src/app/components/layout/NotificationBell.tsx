"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiBell,
  FiCheck,
  FiMessageSquare,
  FiHeart,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSocket } from "../providers/SocketProvider";
import { apiEndpoint } from "@/lib/api";

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

export function NotificationBell({
  placement = "top",
}: {
  placement?: "top" | "bottom";
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string; description: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const processedIds = useRef(new Set<string>());
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const dropdownPosition =
    placement === "bottom"
      ? "fixed top-[76px] right-4 left-4 sm:left-auto sm:absolute sm:top-full sm:right-0 sm:mt-3"
      : "fixed top-[76px] right-4 left-4 sm:left-auto sm:absolute sm:top-full sm:right-0 sm:mt-3";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    try {
      const res = await fetch(
        apiEndpoint("/notifications?limit=30"),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        
        const newSet = new Set<string>();
        data.items.forEach((n: Notification) => newSet.add(n.id));
        processedIds.current = newSet;

        setNotifications(data.items);
        setGlobalUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      fetchNotifications();
    };

    const handleNotification = (newNotification: Notification) => {
      if (processedIds.current.has(newNotification.id)) {
        return;
      }
      
      processedIds.current.add(newNotification.id);
      
      setNotifications((current) => {
        return [newNotification, ...current];
      });
      setGlobalUnreadCount((prev) => prev + 1);
    };

    const handleRoomRead = (data: { roomId: string, resourceUrl?: string }) => {
      setNotifications((current) => {
        let markedCount = 0;
        const mapped = current.map(n => {
          if (n.type === "MESSAGE" && !n.read && (n.metadata?.roomId === data.roomId || n.resourceUrl === `/dashboard/chat/${data.roomId}`)) {
            markedCount++;
            return { ...n, read: true };
          }
          return n;
        });
        if (markedCount > 0) {
          setGlobalUnreadCount(prev => Math.max(0, prev - markedCount));
        }
        return mapped;
      });
    };

    const handleAllRead = () => {
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
      setGlobalUnreadCount(0);
    };

    const handleSingleRead = (data: { notificationId: string }) => {
      setNotifications((current) => {
        const index = current.findIndex(n => n.id === data.notificationId);
        if (index === -1) return current;
        if (current[index].read) return current;
        setGlobalUnreadCount(prev => Math.max(0, prev - 1));
        const newArr = [...current];
        newArr[index] = { ...newArr[index], read: true };
        return newArr;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("notification:received", handleNotification);
    socket.on("notifications:room-read", handleRoomRead);
    socket.on("notifications:all-read", handleAllRead);
    socket.on("notification:read", handleSingleRead);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:received", handleNotification);
      socket.off("notifications:room-read", handleRoomRead);
      socket.off("notifications:all-read", handleAllRead);
      socket.off("notification:read", handleSingleRead);
    };
  }, [socket, fetchNotifications]);



  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <FiHeart className="text-red-500" />;
      case "COMMENT":
        return <FiMessageSquare className="text-blue-500" />;
      case "MESSAGE":
        return <FiMessageSquare className="text-emerald-500" />;
      default:
        return <FiBell className="text-zinc-400" />;
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
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      setNotifications((p) => p.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));

      const token = localStorage.getItem("connectu_token");
      fetch(apiEndpoint(`/notifications/${notification.id}/read`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
         if (!res.ok) throw new Error("Falha na API");
      }).catch(error => {
        console.error("Erro ao marcar como lida:", error);
        setToastMsg({ title: "Erro", description: "Não foi possível marcar como lida." });
      });
    }

    setIsOpen(false);

    if (notification.resourceUrl && notification.resourceUrl.startsWith("/dashboard/")) {
      router.push(notification.resourceUrl);
    } else {
      console.warn("[Notification Click] URL inválida ou não interna:", notification.resourceUrl);
    }
  };

  const displayedNotifications = notifications.filter((n) => activeTab === "ALL" || !n.read);

  const groupByDate = (notifs: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStr = now.toLocaleDateString("pt-BR");
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString("pt-BR");

    notifs.forEach((n) => {
      const d = new Date(n.createdAt).toLocaleDateString("pt-BR");
      if (d === todayStr) {
        today.push(n);
      } else if (d === yesterdayStr) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, older };
  };

  const grouped = groupByDate(displayedNotifications);

  const renderNotificationItem = (notification: Notification) => {
    return (
      <button
        key={notification.id}
        type="button"
        onClick={() => handleNotificationClick(notification)}
        className={`w-full text-left p-md rounded-lg flex gap-md transition-all hover:bg-surface-variant cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary ${!notification.read ? "bg-primary/5" : ""}`}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-surface-variant text-primary relative">
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
            <p className="min-w-0 flex-1 truncate text-body-md font-bold text-on-surface">
               {notification.type === "MESSAGE" 
                  ? (notification.actor?.name ? `${notification.actor.name} enviou uma nova mensagem` : "Nova mensagem") 
                  : (notification.title.includes("undefined") ? "Nova notificação" : notification.title)
               }
            </p>
            <time className="shrink-0 text-on-surface-variant text-[11px] whitespace-nowrap pt-0.5">
               {formatTime(notification.createdAt)}
            </time>
          </div>
          <p className="text-body-sm text-on-surface-variant line-clamp-1 mb-2 mt-1">
            {notification.description}
          </p>
          {!notification.read && (
            <div className="flex items-center justify-end">
              <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
            </div>
          )}
        </div>
      </button>
    );
  };



  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    setGlobalUnreadCount(0);

    try {
      const res = await fetch(
        apiEndpoint("/notifications/read-all"),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Falha ao marcar notificações (${res.status}).`);
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      setToastMsg({
        title: "Erro",
        description: "Não foi possível marcar todas como lidas.",
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
      >
        <FiBell className="text-xl" />
        {globalUnreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-zinc-950">
            {globalUnreadCount > 9 ? "9+" : globalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className={`${dropdownPosition} w-auto sm:w-[400px] bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[85vh] origin-top-right ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200`}>
          {/* Header Fixo */}
          <div className="p-md flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md text-on-surface">Notificações</h2>
            <button 
              onClick={handleMarkAllAsRead}
              disabled={globalUnreadCount === 0}
              className="text-primary hover:text-primary-container transition-colors text-body-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Marcar todas como lidas
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center px-md pt-md bg-surface-container-low">
            <button 
              onClick={() => setActiveTab("ALL")}
              className={`relative px-4 py-3 text-[13px] font-bold transition-colors ${activeTab === "ALL" ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-0.5 after:bg-primary after:rounded-t-full" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setActiveTab("UNREAD")}
              className={`flex-1 py-2 text-body-md font-semibold text-center flex items-center justify-center gap-sm relative transition-all ${
                activeTab === "UNREAD" 
                  ? "text-primary after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-0.5 after:bg-primary" 
                  : "text-on-surface-variant hover:bg-surface-variant rounded-t-lg"
              }`}
            >
              Não lidas
              {globalUnreadCount > 0 && (
                 <span className="bg-primary/20 text-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{globalUnreadCount}</span>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mt-sm pb-md">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <FiBell className="mx-auto text-3xl mb-2 opacity-20" />
                <p className="text-body-sm">Nenhuma notificação {activeTab === "UNREAD" ? "não lida" : "ainda"}.</p>
              </div>
            ) : (
              <>
                {grouped.today.length > 0 && (
                  <div className="mt-sm px-md mb-md">
                    <p className="text-label-md font-bold text-on-surface-variant mb-item-gap">Hoje</p>
                    <div className="flex flex-col gap-xs">
                      {grouped.today.map((notification) => renderNotificationItem(notification))}
                    </div>
                  </div>
                )}
                {grouped.yesterday.length > 0 && (
                  <div className="px-md mb-md">
                    <p className="text-label-md font-bold text-on-surface-variant mb-item-gap">Ontem</p>
                    <div className="flex flex-col gap-xs">
                      {grouped.yesterday.map((notification) => renderNotificationItem(notification))}
                    </div>
                  </div>
                )}
                {grouped.older.length > 0 && (
                  <div className="px-md mb-md">
                    <p className="text-label-md font-bold text-on-surface-variant mb-item-gap">Anteriores</p>
                    <div className="flex flex-col gap-xs">
                      {grouped.older.map((notification) => renderNotificationItem(notification))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rodapé Fixo */}
          <div className="p-md bg-surface-container-low border-t border-outline-variant/30 text-center">
            <button onClick={() => {
              setIsOpen(false);
              router.push("/dashboard/notificacoes");
            }} className="text-primary font-bold text-body-md hover:underline transition-all">Ver todas as notificações</button>
          </div>
        </div>
      )}

      {/* Toast Notification (Customizado ConnectU) */}
      {toastMsg && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[320px] max-w-[calc(100vw-32px)] bg-surface-container-highest border border-outline-variant rounded-xl shadow-2xl p-4 z-[300] animate-fadeIn flex flex-col gap-1">
          <div className="flex justify-between items-center gap-2">
             <h3 className="text-body-md font-bold text-on-surface">{toastMsg.title}</h3>
             <button onClick={() => setToastMsg(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
               <FiCheck />
             </button>
          </div>
          <p className="text-body-sm text-on-surface-variant">{toastMsg.description}</p>
        </div>
      )}
    </div>
  );
}
