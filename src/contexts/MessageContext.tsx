import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { MessageService } from "../service/Message.service";
import { ProductService } from "../service/Product.service";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

import type { MessageRequestDto } from "../dtos/request/message-request.dto";

type MessageContextValue = {
  messageCount: number;
  refreshMessageCount: () => void;
  decrementMessageCount: () => void;
  clearMessageCount: () => void;
  checkStockAndNotify: () => Promise<void>;
  createMessage: (dto: MessageRequestDto) => Promise<void>;
};


const MessageContext = createContext<MessageContextValue | undefined>(
  undefined,
);


export function MessageProvider({ children }: { children: ReactNode }) {
  const [messageCount, setMessageCount] = useState(0);
  const shownIds = useRef<Set<string>>(new Set());
  const shownKeys = useRef<Set<string>>(new Set()); // productId-type
  const { user } = useAuth();
  const companyId = user?.companyId;

  const refreshMessageCount = useCallback(() => {
    if (companyId)
      MessageService.findAll(companyId)
        .then((data) => {
          setMessageCount(data.length);
          data.forEach((m) => {
            shownIds.current.add(String(m.id));
            if (m.productId && m.type) {
              shownKeys.current.add(`${m.productId}-${m.type}`);
            }
          });
        })
        .catch(() => {});
  }, [companyId]);

  const decrementMessageCount = useCallback(() => {
    setMessageCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearMessageCount = useCallback(() => {
    setMessageCount(0);
    shownIds.current.clear();
    shownKeys.current.clear();
  }, []);

  const createMessage = useCallback(async (dto: MessageRequestDto) => {
    try {
      const created = await MessageService.create(dto);
      // Se a mensagem já existia, não mostrar toast de sucesso
      const key = `${created.productId}-${created.type}`;
      const isNova = !shownKeys.current.has(key);
      if (isNova) {
        shownKeys.current.add(key);
        shownIds.current.add(String(created.id));
        if (created.type === "esgotado") {
          toast.error(created.description);
        } else if (created.type === "estoque_baixo") {
          toast.warning(created.description);
        } else {
          toast.success("Mensagem criada com sucesso!");
        }
      }
      refreshMessageCount();
    } catch (err) {
      toast.error("Erro ao criar mensagem");
    }
  }, [refreshMessageCount]);

  const checkStockAndNotify = useCallback(async () => {
    if (companyId)
      try {
        const products = await ProductService.findAll(companyId);
        for (const p of products) {
          const primaryImage = (p.images || []).find(
            (img: any) => img.isPrimary,
          );
          const imageUrl = primaryImage?.url || p.images?.[0]?.url || "";
          if (Array.isArray(p.variations) && p.variations.length > 0) {
            // Se tem variações, só verifica as variações e nunca cria mensagem para o produto principal
            for (const v of p.variations) {
              const varImage = v.imageUrl || imageUrl;
              const varName =
                `${p.name} - ${v.color || ""} ${v.size || ""}`.trim();
              const varStock = Math.max(0, Number(v.stock ?? 0));
              // Evita duplicidade: só cria se não existir mensagem igual
              if (Number(v.stock ?? 0) <= 0) {
                const key = `${v.id}-esgotado`;
                if (!shownKeys.current.has(key)) {
                  shownKeys.current.add(key);
                  try {
                    const created = await MessageService.create({
                      productId: v.id,
                      name: varName,
                      url: varImage,
                      type: "esgotado",
                      description: `A variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" foi esgotada. Estoque zerado. Realize a reposição imediatamente.`,
                      companyId,
                    });
                    if (
                      created &&
                      created.id &&
                      !shownIds.current.has(String(created.id))
                    ) {
                      shownIds.current.add(String(created.id));
                      // toast removido: exibe apenas ao criar manualmente
                    }
                  } catch {}
                }
              }
              if (
                Number(v.stock ?? 0) > 0 &&
                varStock < Number(v.lowStock ?? 0)
              ) {
                const key = `${v.id}-estoque_baixo`;
                if (!shownKeys.current.has(key)) {
                  shownKeys.current.add(key);
                  try {
                    const created = await MessageService.create({
                      productId: v.id,
                      name: varName,
                      url: varImage,
                      type: "estoque_baixo",
                      description: `Alerta de estoque baixo: a variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" possui apenas ${varStock} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
                      companyId,
                    });
                    if (
                      created &&
                      created.id &&
                      !shownIds.current.has(String(created.id))
                    ) {
                      shownIds.current.add(String(created.id));
                      // toast removido: exibe apenas ao criar manualmente
                    }
                  } catch {}
                }
              }
            }
          } else {
            // Só verifica o produto principal se NÃO houver variações
            const mainStock = Math.max(0, p.stock ?? 0);
            if (Number(p.stock ?? 0) <= 0) {
              const key = `${p.id}-esgotado`;
              if (!shownKeys.current.has(key)) {
                shownKeys.current.add(key);
                try {
                  const created = await MessageService.create({
                    productId: p.id,
                    name: p.name,
                    url: imageUrl,
                    type: "esgotado",
                    description: `O produto "${p.name}" foi esgotado. Estoque zerado. Realize a reposição imediatamente.`,
                    companyId,
                  });
                  if (
                    created &&
                    created.id &&
                    !shownIds.current.has(String(created.id))
                  ) {
                    shownIds.current.add(String(created.id));
                    // toast removido: exibe apenas ao criar manualmente
                  }
                } catch {}
              }
            } else if (
              Number(p.stock ?? 0) > 0 &&
              Number(p.stock ?? 0) < Number(p.lowStock ?? 0)
            ) {
              const key = `${p.id}-estoque_baixo`;
              if (!shownKeys.current.has(key)) {
                shownKeys.current.add(key);
                try {
                  const created = await MessageService.create({
                    productId: p.id,
                    name: p.name,
                    url: imageUrl,
                    type: "estoque_baixo",
                    description: `Alerta de estoque baixo: o produto "${p.name}" possui apenas ${mainStock} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
                    companyId,
                  });
                  if (
                    created &&
                    created.id &&
                    !shownIds.current.has(String(created.id))
                  ) {
                    shownIds.current.add(String(created.id));
                    // toast removido: exibe apenas ao criar manualmente
                  }
                } catch {}
              }
            }
          }
        }
      } catch {}
    refreshMessageCount();
  }, [refreshMessageCount, companyId]);

  useEffect(() => {
    refreshMessageCount();
    const interval = setInterval(refreshMessageCount, 30000);
    return () => clearInterval(interval);
  }, [refreshMessageCount]);

  return (
    <MessageContext.Provider
      value={{
        messageCount,
        refreshMessageCount,
        decrementMessageCount,
        clearMessageCount,
        checkStockAndNotify,
        createMessage,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const ctx = useContext(MessageContext);
  if (!ctx)
    throw new Error("useMessageContext must be used within MessageProvider");
  return ctx;
}
