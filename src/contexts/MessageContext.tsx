import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MessageService } from "../service/Message.service";
import { ProductService } from "../service/Product.service";
import { toast } from "react-toastify";

type MessageContextValue = {
  messageCount: number;
  refreshMessageCount: () => void;
  decrementMessageCount: () => void;
  clearMessageCount: () => void;
  checkStockAndNotify: () => Promise<void>;
};

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messageCount, setMessageCount] = useState(0);
  const shownIds = useRef<Set<string>>(new Set());

  const refreshMessageCount = useCallback(() => {
    MessageService.findAll()
      .then((data) => {
        setMessageCount(data.length);
        data.forEach((m) => shownIds.current.add(String(m.id)));
      })
      .catch(() => {});
  }, []);

  const decrementMessageCount = useCallback(() => {
    setMessageCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearMessageCount = useCallback(() => {
    setMessageCount(0);
    shownIds.current.clear();
  }, []);

  const checkStockAndNotify = useCallback(async () => {
    try {
      const products = await ProductService.findAll();
      for (const p of products) {
        const primaryImage = (p.images || []).find((img: any) => img.isPrimary);
        const imageUrl = primaryImage?.url || p.images?.[0]?.url || "";
        const mainStock = Math.max(0, p.stock ?? 0);
        if (p.isActiveStock && (p.stock ?? 0) <= 0) {
          try {
            const created = await MessageService.create({
              productId: p.id,
              name: p.name,
              url: imageUrl,
              type: "esgotado",
              description: `O produto "${p.name}" foi esgotado. Estoque zerado. Realize a reposição imediatamente.`,
            });
            if (created && created.id && !shownIds.current.has(String(created.id))) {
              shownIds.current.add(String(created.id));
              toast.error(`O produto "${p.name}" foi esgotado. Estoque zerado.`);
            }
          } catch {}
        } else if (p.isActiveStock && (p.stock ?? 0) < (p.lowStock ?? 0)) {
          try {
            const created = await MessageService.create({
              productId: p.id,
              name: p.name,
              url: imageUrl,
              type: "estoque_baixo",
              description: `Alerta de estoque baixo: o produto "${p.name}" possui apenas ${mainStock} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
            });
            if (created && created.id && !shownIds.current.has(String(created.id))) {
              shownIds.current.add(String(created.id));
              toast.warning(
                `Alerta de estoque baixo para o produto "${p.name}". Apenas ${mainStock} unidades restantes.`,
              );
            }
          } catch {}
        }
        if (Array.isArray(p.variations)) {
          for (const v of p.variations) {
            const varImage = v.imageUrl || imageUrl;
            const varName = `${p.name} - ${v.color || ""} ${v.size || ""}`.trim();
            const varStock = Math.max(0, Number(v.stock ?? 0));
            if (Number(v.stock ?? 0) <= 0) {
              try {
                const created = await MessageService.create({
                  productId: p.id,
                  name: varName,
                  url: varImage,
                  type: "esgotado",
                  description: `A variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" foi esgotada. Estoque zerado. Realize a reposição imediatamente.`,
                });
                if (created && created.id && !shownIds.current.has(String(created.id))) {
                  shownIds.current.add(String(created.id));
                  toast.error(
                    `A variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" foi esgotada. Estoque zerado.`,
                  );
                }
              } catch {}
            } else if (p.isActiveStock && (p.lowStock ?? 0) > varStock) {
              try {
                const created = await MessageService.create({
                  productId: p.id,
                  name: varName,
                  url: varImage,
                  type: "estoque_baixo",
                  description: `Alerta de estoque baixo: a variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" possui apenas ${varStock} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
                });
                if (created && created.id && !shownIds.current.has(String(created.id))) {
                  shownIds.current.add(String(created.id));
                  toast.warning(
                    `A variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" possui estoque baixo. Apenas ${varStock} unidades restantes.`,
                  );
                }
              } catch {}
            }
          }
        }
      }
    } catch {}
    refreshMessageCount();
  }, [refreshMessageCount]);

  useEffect(() => {
    refreshMessageCount();
    const interval = setInterval(refreshMessageCount, 30000);
    return () => clearInterval(interval);
  }, [refreshMessageCount]);

  return (
    <MessageContext.Provider
      value={{ messageCount, refreshMessageCount, decrementMessageCount, clearMessageCount, checkStockAndNotify }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessageContext must be used within MessageProvider");
  return ctx;
}
