"use client";

import { io } from "socket.io-client";

const token =
  typeof window !== "undefined" ? localStorage.getItem("connectu_token") : "";

export const socket = io("https://connectu-gd1z.onrender.com", {
  auth: {
    token: token,
  },
  autoConnect: true,
  transports: ["websocket"],
  withCredentials: true,
});
