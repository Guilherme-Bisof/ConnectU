"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiBell,
  FiCheck,
  FiMessageSquare,
  FiHeart,
  FiUser,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { read } from "fs";

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "MESSAGE" | "SYSTEM";
  title: string;
  content: string;
  read: boolean;
  postId?: string;
  createdAt: string;
}

export function NotificationBell({
  placement = "top",
}: {
  placement?: "top" | "bottom";
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const dropdownPosition =
    placement === "bottom"
      ? "bottom-full left-0 mb-3"
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
    const token = localStorage.getItem("connectu_token");
    if (!token) return;

    const socket: Socket = io("https://connectu-gd1z.onrender.com", {
      auth: { token },
    });

    socket.on("notification:received", (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket.disconnect();
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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const token = localStorage.getItem("connectu_token");
      try {
        await fetch(
          `https://connectu-gd1z.onrender.com/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    }

    setIsOpen(false);

    if (notification.type === "MESSAGE") {
      router.push("/dashboard/chat");
    } else if (notification.postId) {
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
      {/* Botão do Sino */}
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
          className={`absolute ${dropdownPosition} w-80 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden animate-fadeIn`}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-bold text-white">Notificações</h3>
            {unreadCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-500 font-medium">
                  {unreadCount} não lidas
                </span>

                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400 hover:text-blue-400 transition-colors bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-800"
                  title="Marcar todas como lidas"
                >
                  <FiCheck size={12} /> Lidas
                </button>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <FiBell className="mx-auto text-3xl mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 text-left transition-colors border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/50 ${!notification.read ? "bg-blue-500/5" : ""}`}
                  >
                    <div className="mt-1 shrink-0 bg-zinc-800 p-2 rounded-full">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${!notification.read ? "text-white font-bold" : "text-zinc-300 font-medium"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
