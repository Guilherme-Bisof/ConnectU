"use client";

import { useEffect } from "react";
import { socket } from "../../../lib/socket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!socket) {
      console.error("[SocketProvider] socket não existe");
      return;
    }

    const handleConnect = () => {};

    const handleDisconnect = () => {};

    const handleConnectError = (error: Error) => {
      console.error("[SocketProvider] erro de conexão:", error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  return <>{children}</>;
}
