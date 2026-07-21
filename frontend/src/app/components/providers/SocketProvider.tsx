"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../../../lib/api";

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
    const instance = io(API_URL, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket"],
      withCredentials: true,
    });




    const handleConnectError = (error: Error) => {
      console.error("[SocketProvider] Erro de conexão:", error);
    };

    const handleDeliveryRequest = (data: { messageId: string; roomId: string }) => {
      instance.emit("message:delivered", data);
    };

    instance.on("connect_error", handleConnectError);
    instance.on("message:delivery-request", handleDeliveryRequest);

    // eslint-disable-next-line
    setSocket(instance);

    return () => {
      instance.off("connect_error", handleConnectError);
      instance.off("message:delivery-request", handleDeliveryRequest);
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
