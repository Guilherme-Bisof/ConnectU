"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiBell,
  FiCheck,
  FiMessageSquare,
  FiHeart,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { socket } from "../../../lib/socket";

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
  console.log("[NotificationBell] renderizado");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string; description: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const dropdownPosition =
    placement === "bottom"
      ? "top-full right-0 mt-3"
      : "top-full right-0 mt-3";

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

  useEffect(() => {
    async function fetchNotifications() {
      const token = localStorage.getItem("connectu_token");
      if (!token) return;

      try {
        const res = await fetch(
          "https://connectu-gd1z.onrender.com/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    }
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) {
      console.error("[NotificationBell] socket indisponível");
      return;
    }

    console.log("[NotificationBell] registrando listener", {
      connected: socket.connected,
      socketId: socket.id,
    });

    const debugAnyEvent = (eventName: string, ...args: unknown[]) => {
      console.log("[Socket ANY]", eventName, args);
    };
    socket.onAny(debugAnyEvent);

    const handleNotification = (newNotification: Notification) => {
      console.log("[NotificationBell] notification:received", newNotification);

      setNotifications((current) => {
        const duplicated = current.some((item) => item.id === newNotification.id);
        console.log("[NotificationBell] duplicada:", duplicated);

        if (duplicated) {
          return current;
        }
        return [newNotification, ...current];
      });
    };

    socket.on("notification:received", handleNotification);

    return () => {
      console.log("[NotificationBell] removendo listener");
      socket.off("notification:received", handleNotification);
      socket.offAny(debugAnyEvent);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`p-md rounded-lg flex gap-md transition-all hover:bg-surface-variant cursor-pointer group ${!notification.read ? "bg-primary/5" : ""}`}
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
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-body-md font-bold text-on-surface truncate pr-2">
                 {notification.type === "MESSAGE" 
                    ? (notification.actor?.name ? `${notification.actor.name} enviou uma nova mensagem` : "Nova mensagem") 
                    : (notification.title.includes("undefined") ? "Nova notificação" : notification.title)
                 }
              </h4>
            </div>
            <time className="shrink-0 text-on-surface-variant text-[11px] whitespace-nowrap pt-0.5">
               {formatTime(notification.createdAt)}
            </time>
          </div>
          <p className="text-body-sm text-on-surface-variant line-clamp-1 mb-2">
            {notification.description}
          </p>
          {!notification.read && (
            <div className="flex items-center justify-end">
              <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const prev = [...notifications];
      setNotifications((p) => p.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));

      const token = localStorage.getItem("connectu_token");
      try {
        await fetch(
          `https://connectu-gd1z.onrender.com/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
        setNotifications(prev);
      }
    }

    setIsOpen(false);

    if (notification.resourceUrl && notification.resourceUrl.startsWith("/dashboard/")) {
      router.push(notification.resourceUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    try {
      const res = await fetch(
        "https://connectu-gd1z.onrender.com/notifications/read-all",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
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
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div
          className={`absolute ${dropdownPosition} w-[400px] bg-surface-container-low border border-outline-variant rounded-[14px] shadow-2xl z-50 flex flex-col max-h-[calc(100vh-100px)] overflow-hidden animate-fadeIn`}
        >
          {/* Header Fixo */}
          <div className="p-md flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md text-on-surface">Notificações</h2>
            <button 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-primary hover:text-primary-container transition-colors text-body-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Marcar todas como lidas
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center px-md pt-md bg-surface-container-low">
            <button 
              onClick={() => setActiveTab("ALL")}
              className={`flex-1 py-2 text-body-md font-semibold text-center relative transition-all ${
                activeTab === "ALL" 
                  ? "text-primary after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-[40px] after:h-[2px] after:bg-primary" 
                  : "text-on-surface-variant hover:bg-surface-variant rounded-t-lg"
              }`}
            >
              Todas
            </button>
            <button 
              onClick={() => setActiveTab("UNREAD")}
              className={`flex-1 py-2 text-body-md font-semibold text-center flex items-center justify-center gap-sm relative transition-all ${
                activeTab === "UNREAD" 
                  ? "text-primary after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-[40px] after:h-[2px] after:bg-primary" 
                  : "text-on-surface-variant hover:bg-surface-variant rounded-t-lg"
              }`}
            >
              Não lidas
              {unreadCount > 0 && (
                 <span className="bg-primary/20 text-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{unreadCount}</span>
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
            <button onClick={() => setToastMsg({title: "Em breve", description: "A página de notificações completas está em desenvolvimento."})} className="text-primary font-bold text-body-md hover:underline transition-all">Ver todas as notificações</button>
          </div>
        </div>
      )}

      {/* Toast Notification (Customizado ConnectU) */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest border border-outline-variant rounded-xl shadow-2xl p-4 min-w-[300px] z-300 animate-fadeIn flex flex-col gap-1">
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
