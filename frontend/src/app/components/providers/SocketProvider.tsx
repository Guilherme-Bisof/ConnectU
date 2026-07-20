"use client";

import { useEffect } from "react";
import { socket } from "../../../lib/socket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[SocketProvider] montado");

    if (!socket) {
      console.error("[SocketProvider] socket não existe");
      return;
    }

    const handleConnect = () => {
      console.log("[SocketProvider] conectado:", socket.id);
    };

    const handleDisconnect = (reason: string) => {
      console.warn("[SocketProvider] desconectado:", reason);
    };

    const handleConnectError = (error: Error) => {
      console.error("[SocketProvider] erro de conexão:", error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      console.log("[SocketProvider] já estava conectado:", socket.id);
    }

    return () => {
      console.log("[SocketProvider] desmontado");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  return <>{children}</>;
}
