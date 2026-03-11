import { createPortal } from "react-dom";
import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiCopy,
} from "react-icons/fi";
import style from "./MessageModal.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageService } from "../../service/Message.service";
import type { MessageResponseDto } from "../../dtos/response/message-response.dto";

// Mensagem real vem do backend (MessageResponseDto)
const handleCopy = (productId?: string) => {
  if (!productId) return;
  navigator.clipboard.writeText(productId);
};

type MessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export function MessageModal({
  isOpen,
  onClose,
  title = "Mensagens",
}: MessageModalProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageResponseDto[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    MessageService.findAll().then(setMessages);
  }, [isOpen]);

  if (!isOpen) return null;

  // Se houver campo de leitura, pode-se calcular unreadCount, senão omite
  // const unreadCount = messages.filter(m => !m.read).length;
  return createPortal(
    <div className={style.backdrop} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <div className={style.header}>
          <div className={style.headerLeft}>
            <span className={style.title}>{title}</span>
          </div>
          <button className={style.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className={style.content}>
          {messages.length === 0 ? (
            <div className={style.empty}>Nenhuma mensagem.</div>
          ) : (
            <div className={style.list}>
              {messages.map((msg) => {
                const isExpanded = expandedId === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={style.card}
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  >
                    <div className={style.cardTop}>
                      <div className={style.cardLeft}>
                        <div className={style.cardMeta}>
                          <FiAlertTriangle className={style.cardIconInline} />
                          <span className={style.productName}>{msg.name}</span>
                        </div>
                        <p className={`${style.cardText} ${isExpanded ? style.cardTextExpanded : ""}`}>{msg.description}</p>
                        <span className={style.chevron}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                        {isExpanded && (
                          <div className={style.producIdRow} onClick={e => e.stopPropagation()}>
                            <div className={style.producIdInfo}>
                              <span className={style.producIdLabel}>ID</span>
                              <span className={style.producIdValue}>{msg.productId.length > 8 ? `${msg.productId.slice(0, 7)}...` : msg.productId}</span>
                              <button className={style.copyBtn} onClick={() => handleCopy(msg.productId)} title="Copiar ID"><FiCopy /></button>
                            </div>
                            <button className={style.searchBtn} onClick={() => { onClose(); navigate(msg.type === 'esgotado' ? '/out-of-stock' : '/produtos', { state: { id: msg.productId } }); }}>Buscar produto</button>
                          </div>
                        )}
                      </div>
                      <img src={msg.url} alt={msg.name} className={style.productImg} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
