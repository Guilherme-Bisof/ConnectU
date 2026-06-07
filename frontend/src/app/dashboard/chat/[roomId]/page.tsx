"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { FiSend, FiPaperclip } from "react-icons/fi";

const socket = io("https://connectu-gd1z.onrender.com");

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  companyId?: string;
}

export default function ChatPage() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [user] = useState<UserData | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("connectu_user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrar na sala
    if (roomId) {
      socket.emit("join_room", roomId);
    }

    // Escutar novas mensagens
    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      roomId,
      senderId: user.id,
      content: newMessage,
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.senderId === user?.id
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-zinc-800 text-zinc-200 rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input de mensagem */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-3">
        <button className="text-zinc-500 hover:text-white">
          <FiPaperclip size={20} />
        </button>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-zinc-900 text-white px-4 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 p-2.5 rounded-lg text-white hover:bg-blue-700 transition-colors"
        >
          <FiSend size={18} />
        </button>
      </div>
    </div>
  );
}
