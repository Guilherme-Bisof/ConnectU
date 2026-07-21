"use client";

import { FiMessageSquare } from "react-icons/fi";

export default function ChatEmptyPage() {
  return (
    <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-surface relative text-center">
      <div className="absolute w-125 h-125 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center w-full min-w-75">
        <div className="w-20 h-20 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant mb-6 shadow-2xl rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-500">
          <FiMessageSquare size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-on-surface mb-2 whitespace-nowrap">
          Central de Mensagens ConnectU
        </h3>
        <p className="text-sm text-on-surface-variant max-w-95 leading-relaxed mx-auto">
          Selecione uma conversa na lista lateral para abrir o chat em tempo real e negociar as melhores oportunidades.
        </p>
      </div>
    </main>
  );
}