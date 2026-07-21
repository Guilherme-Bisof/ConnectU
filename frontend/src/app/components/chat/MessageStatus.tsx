import React from "react";
import { FiCheck } from "react-icons/fi";

export type MessageDeliveryStatus = "SENT" | "DELIVERED" | "READ";

interface MessageStatusProps {
  status?: MessageDeliveryStatus;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export function MessageStatus({ status = "SENT", deliveredAt, readAt }: MessageStatusProps) {
  const tooltipText = 
    status === "READ" ? (readAt ? `Lida às ${new Date(readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Lida") :
    status === "DELIVERED" ? (deliveredAt ? `Entregue às ${new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Entregue") :
    "Enviada";

  const ariaLabel = 
    status === "READ" ? "Mensagem lida" :
    status === "DELIVERED" ? "Mensagem entregue" :
    "Mensagem enviada";

  if (status === "SENT") {
    return (
      <div className="relative h-4 w-4" title={tooltipText} aria-label={ariaLabel}>
        <FiCheck className="absolute left-0 text-[#8B90A0]" size={14} strokeWidth={3} />
      </div>
    );
  }

  const isRead = status === "READ";
  const iconColor = isRead ? "text-[#0070F3]" : "text-[#AEB4C2]";

  return (
    <div className="relative h-4 w-5.5" title={tooltipText} aria-label={ariaLabel}>
      <FiCheck className={`absolute left-0 ${iconColor}`} size={14} strokeWidth={3} />
      <FiCheck className={`absolute left-1.25 ${iconColor}`} size={14} strokeWidth={3} />
    </div>
  );
}
