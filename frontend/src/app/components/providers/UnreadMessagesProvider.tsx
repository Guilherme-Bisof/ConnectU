"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "./SocketProvider";
import { API_URL } from "../../../lib/api";

export type UnreadMessagesContextValue = {
  totalUnread: number;
  unreadByRoom: Record<string, number>;
  markRoomAsRead: (roomId: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | undefined>(undefined);

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  
  // Track last processed message per room to prevent processing older messages
  const lastProcessedMessage = useRef<Record<string, string>>({});
  const { socket } = useSocket();

  const refreshUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("connectu_token");
      if (!token) return;

      const res = await fetch(`${API_URL}/chat/unread-summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      setTotalUnread(data.totalUnread || 0);
      setUnreadByRoom(data.byRoom || {});
    } catch (error) {
      console.error("[UnreadMessages] Erro ao buscar resumo:", error);
    }
  }, []);

  const markRoomAsRead = useCallback(async (roomId: string) => {
    // 1. Otimista
    setUnreadByRoom((prev) => {
      if (!prev[roomId]) return prev;
      const copy = { ...prev };
      const subtract = copy[roomId];
      delete copy[roomId];
      
      setTotalUnread((t) => Math.max(0, t - subtract));
      return copy;
    });

    try {
      const token = localStorage.getItem("connectu_token");
      if (!token) return;

      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        // Fallback para estado do servidor em caso de falha
        refreshUnread();
        console.warn("Falha ao marcar como lido na API.");
      } else {
        const data = await res.json();
        // Substituir os valores otimistas pela verdade do servidor (Backend as Truth)
        setTotalUnread(data.totalUnread);
        setUnreadByRoom((prev) => {
          const next = { ...prev };
          if (data.unreadCount === 0) {
             delete next[roomId];
          } else {
             next[roomId] = data.unreadCount;
          }
          return next;
        });
      }
    } catch (error) {
      console.error("[UnreadMessages] Erro ao marcar sala como lida:", error);
      refreshUnread(); // rollback
    }
  }, [refreshUnread]);

  useEffect(() => {
    if (!socket) return;
    
    // eslint-disable-next-line
    refreshUnread();

    const handleUnreadUpdated = (data: { roomId: string, messageId: string, unreadCount: number, totalUnread: number }) => {
      console.log("[Unread Socket Event]", data);
      
      const { roomId, messageId, unreadCount, totalUnread } = data;
      
      // Basic idempotency (If we already processed this message, ignore)
      if (lastProcessedMessage.current[roomId] === messageId) {
        return;
      }
      lastProcessedMessage.current[roomId] = messageId;

      setTotalUnread(Math.max(0, totalUnread));
      setUnreadByRoom((prev) => ({
        ...prev,
        [roomId]: Math.max(0, unreadCount)
      }));
    };

    const handleRoomRead = (data: { roomId: string, unreadCount: number, totalUnread: number }) => {
      setTotalUnread(data.totalUnread);
      setUnreadByRoom((prev) => {
        const next = { ...prev };
        delete next[data.roomId];
        return next;
      });
    };

    socket.on("chat:unread-updated", handleUnreadUpdated);
    socket.on("chat:room-read", handleRoomRead);

    return () => {
      socket.off("chat:unread-updated", handleUnreadUpdated);
      socket.off("chat:room-read", handleRoomRead);
    };
  }, [refreshUnread, socket]);

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, unreadByRoom, markRoomAsRead, refreshUnread }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error("useUnreadMessages must be used within an UnreadMessagesProvider");
  }
  return context;
}
