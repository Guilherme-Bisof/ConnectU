"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("connectu_token") : null;
    if (!token) return;

    // Conecta na API local em ambiente de desenvolvimento
    const instance = io("http://localhost:3333", {
      auth: { token },
      autoConnect: true,
      transports: ["websocket"],
      withCredentials: true,
    });

    instance.onAny((eventName, ...args) => {
      console.log("[SOCKET EVENT]", eventName, args);
    });

    const handleConnect = () => {
      console.log("[SocketProvider] Conectado:", instance.id);
    };

    const handleDisconnect = () => {
      console.log("[SocketProvider] Desconectado");
    };

    const handleConnectError = (error: Error) => {
      console.error("[SocketProvider] Erro de conexão:", error);
    };

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);
    instance.on("connect_error", handleConnectError);

    // eslint-disable-next-line
    setSocket(instance);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
      instance.off("connect_error", handleConnectError);
      instance.disconnect();
      setSocket(null);
    };
  }, []); // Só monta uma vez. Mas se houver logout, o layout é desmontado.

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
