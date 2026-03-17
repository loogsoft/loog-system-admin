import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiPackage,
  FiUser,
  FiTag,
  FiCreditCard,
  FiHash,
  FiCheckCircle,
  FiAlertTriangle,
  FiShield,
  FiHelpCircle,
} from "react-icons/fi";
import styles from "./DarBaixaModal.module.css";
import type { ProductResponse } from "../dtos/response/product-response.dto";
import { useAuth } from "../contexts/useAuth";
import { StockMovementService } from "../service/Stock-movement.service";
import { useMessageContext } from "../contexts/MessageContext";
import { CircularProgress } from "@mui/material";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: ProductResponse | null;
  onConfirm: (data: BaixaFormData) => void;
  onClick: () => void;
};

export type BaixaFormData = {
  quantity: number;
  reason: string;
  paymentMethod: string;
  responsible: string;
  observation: string;
  operatorEmail: string;
  variationId?: string;
  variationLabel?: string;
  value: number;
};

const REASONS = ["Venda", "Avaria", "Consumo interno", "Devolução", "Perda"];

const REASONS_INFO: Record<string, { desc: string; example: string }> = {
  Venda: {
    desc: "Produto saiu porque foi vendido a um cliente.",
    example: "Ex: Cliente comprou 1 camiseta tamanho M.",
  },
  Avaria: {
    desc: "Produto foi danificado e não pode mais ser vendido.",
    example: "Ex: Camiseta rasgou no estoque.",
  },
  "Consumo interno": {
    desc: "Produto usado pela própria empresa.",
    example: "Ex: Funcionário pegou uma camiseta para uniforme.",
  },
  Devolução: {
    desc: "Produto foi devolvido para o fornecedor.",
    example: "Ex: Loja devolveu 2 camisetas com defeito para o fornecedor.",
  },
  Perda: {
    desc: "Produto desapareceu ou não foi encontrado no estoque.",
    example: "Ex: 1 camiseta sumiu durante a contagem de estoque.",
  },
};
const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Crédito",
  "Débito",
  "Crediario",
];

export function DarBaixaModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  onClick,
}: Props) {
  const { user } = useAuth();
  const operatorEmail = user?.email || "";
  const { checkStockAndNotify } = useMessageContext();

  // Sempre monta uma lista de "variações" incluindo o produto principal
  const allVariations = [
    {
      id: product?.id,
      name: product?.name,
      price: product?.price,
      stock: product?.stock ?? 0,
      color: product?.color ?? "",
      size: product?.size ?? "",
      imageUrl: product?.images?.[0]?.url ?? "",
      isMain: true,
    },
    ...(product?.variations?.map((v) => ({ ...v, isMain: false })) ?? []),
  ];

  const hasVariations = allVariations.length > 1;
  const [selectedVariationIdx, setSelectedVariationIdx] = useState<
    number | null
  >(hasVariations ? null : 0);
  const [form, setForm] = useState({
    quantity: 1,
    value: 0,
    percent: 0,
    reason: "Venda",
    paymentMethod: "PIX",
    responsible: "",
    observation: "",
  });
  const RESPONSIBLE_LIST = ["Bruna", "Eduardo", "Yara"];
  const [responsibleOpen, setResponsibleOpen] = useState(false);
  const responsibleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const reasonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reasonOpen && !responsibleOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        reasonOpen &&
        reasonRef.current &&
        !reasonRef.current.contains(e.target as Node)
      ) {
        setReasonOpen(false);
      }
      if (
        responsibleOpen &&
        responsibleRef.current &&
        !responsibleRef.current.contains(e.target as Node)
      ) {
        setResponsibleOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reasonOpen, responsibleOpen]);

  if (!isOpen || !product) return null;

  // ...removido duplicidade...

  const selectedVariation =
    selectedVariationIdx !== null ? allVariations[selectedVariationIdx] : null;

  const currentStock = selectedVariation ? Number(selectedVariation.stock) : 0;
  const isOverStock = form.quantity > currentStock;
  const isZero = form.quantity <= 0;
  const defaultValue = selectedVariation ? Number(selectedVariation.price) : 0;
  const value = form.value === 0 ? defaultValue : form.value;
  const percent = form.percent;

  const handleConfirm = async () => {
    setLoading(true);
    if (selectedVariationIdx === null) {
      setError("Selecione uma variação antes de confirmar.");
      setLoading(false);
      return;
    }
    if (!form.responsible.trim()) {
      setError("Informe o responsável pela baixa.");
      setLoading(false);
      return;
    }
    if (isZero) {
      setError("A quantidade deve ser maior que zero.");
      setLoading(false);
      return;
    }
    if (isOverStock) {
      setError("Quantidade maior que o estoque disponível.");
      setLoading(false);
      return;
    }
    setError("");

    try {
      if (!selectedVariation?.id) throw new Error("Variação não selecionada");
      await StockMovementService.create({
        productName: product.name,
        variationId: selectedVariation.id,
        type: "OUT",
        quantity: form.quantity,
        reason: form.reason,
        paymentMethod: form.paymentMethod,
        responsibleEmail: operatorEmail,
        responsibleName: form.responsible,
        observation: form.observation,
        price: String(value * form.quantity),
      });
      await checkStockAndNotify();
      onConfirm({
        ...form,
        value: value * form.quantity,
        operatorEmail,
        variationId: selectedVariation.id,
        variationLabel:
          `${selectedVariation.color ?? ""} ${selectedVariation.size ?? ""}`.trim(),
      });
      setLoading(false);
      onClick();
      onClose();
      setForm({
        quantity: 11,
        value: product.price * form.quantity,
        percent: 0,
        reason: "Venda",
        paymentMethod: "PIX",
        responsible: "",
        observation: "",
      });
      setSelectedVariationIdx(hasVariations ? null : 0);
    } catch (error) {
      setError("Erro ao registrar a baixa. Tente novamente.");
      setLoading(false);
    }
  };

  const stockAfter = Math.max(0, currentStock - form.quantity);

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.badge}>AÇÃO DE INVENTÁRIO</span>
            <h2 className={styles.title}>Dar Baixa no Estoque</h2>
          </div>
          <button className={styles.closeBtn} type="button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.productCard}>
          <div className={styles.productThumb}>
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className={styles.productImg}
              />
            ) : (
              <FiPackage className={styles.productIcon} />
            )}
          </div>
          <div className={styles.productInfo}>
            <div className={styles.productName}>{product.name}</div>
            <div className={styles.productCategory}>{product.category}</div>
            <div className={styles.stockRow}>
              <span
                className={`${styles.stockDot} ${currentStock <= product.lowStock ? styles.stockDotLow : styles.stockDotOk}`}
              />
              <span className={styles.stockText}>
                {Math.max(0, currentStock)} em estoque
              </span>
            </div>
          </div>
          {!isZero && !isOverStock && (
            <div className={styles.stockAfterBadge}>
              <span className={styles.stockAfterLabel}>Após a baixa</span>
              <span
                className={`${styles.stockAfterValue} ${stockAfter <= product.lowStock ? styles.stockAfterLow : ""}`}
              >
                {stockAfter}
              </span>
            </div>
          )}
        </div>

        <div className={styles.variationSection}>
          <span className={styles.variationSectionLabel}>
            Selecione a variação
          </span>
          <div className={styles.variationGrid}>
            {allVariations.map((v, idx) => {
              const vStock = Number(v.stock);
              const vPrice = v.price ? Number(v.price) : null;
              const isSelected = selectedVariationIdx === idx;
              return (
                <button
                  key={v.id + (v.isMain ? "-main" : "")}
                  type="button"
                  className={`${styles.variationChip} ${isSelected ? styles.variationChipActive : ""} ${vStock === 0 ? styles.variationChipEmpty : ""}`}
                  onClick={() => {
                    if (!hasVariations) return;
                    setSelectedVariationIdx(idx);
                    setError("");
                    setForm((f) => ({ ...f, quantity: 1 }));
                  }}
                  disabled={!hasVariations && idx === 0}
                  style={
                    !hasVariations && idx === 0
                      ? { cursor: "default", opacity: 0.7 }
                      : {}
                  }
                >
                  {v.imageUrl ? (
                    <img
                      src={Array.isArray(v.imageUrl) ? (v.imageUrl[0] || "") : (v.imageUrl || "")}
                      alt={v.size || v.name}
                      className={styles.variationChipImg}
                    />
                  ) : (
                    <span
                      className={styles.variationChipDot}
                      style={{ background: v.color || "#ccc" }}
                    />
                  )}
                  <div className={styles.variationChipInfo}>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        className={styles.variationColorDot}
                        style={{ background: v.color || "#ccc" }}
                      />
                      <span className={styles.variationChipSize}>
                        {v.size || v.name}
                      </span>
                    </span>
                    {vPrice !== null && (
                      <span className={styles.variationChipPrice}>
                        {vPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    )}
                    <span
                      className={`${styles.variationChipStock} ${vStock === 0 ? styles.variationChipStockEmpty : vStock <= product.lowStock ? styles.variationChipStockLow : ""}`}
                    >
                      {vStock === 0 ? "Sem estoque" : `${vStock} un`}
                    </span>
                  </div>
                  {isSelected && (
                    <span className={styles.variationChipCheck}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiHash className={styles.labelIcon} />
              QUANTIDADE
            </label>
            <input
              className={`${styles.input} ${isOverStock || isZero ? styles.inputError : ""}`}
              type="number"
              min={1}
              max={currentStock}
              value={form.quantity}
              onChange={(e) => {
                setError("");
                setForm((f) => ({ ...f, quantity: Number(e.target.value) }));
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiTag className={styles.labelIcon} />
              VALOR DA BAIXA
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#888", marginRight: 4 }}>
                R$
              </span>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={value * form.quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    value: v,
                    percent:
                      v === 0
                        ? 0
                        : Number(
                            (((v - defaultValue) / defaultValue) * 100).toFixed(
                              2,
                            ),
                          ),
                  }));
                }}
                style={{ width: 110 }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: 8,
                }}
              >
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "none",
                    color: "#22c55e",
                    fontSize: 16,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                  onClick={() => {
                    const newPercent = percent - 1;
                    const newValue = Number(
                      (defaultValue * (1 + newPercent / 100)).toFixed(2),
                    );
                    setForm((f) => ({
                      ...f,
                      percent: newPercent,
                      value: newValue,
                    }));
                  }}
                  aria-label="Aumentar %"
                >
                  ▲
                </button>
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "none",
                    color: "#ef4444",
                    fontSize: 16,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                  onClick={() => {
                    const newPercent = percent + 1;
                    const newValue = Number(
                      (defaultValue * (1 + newPercent / 100)).toFixed(2),
                    );
                    setForm((f) => ({
                      ...f,
                      percent: newPercent,
                      value: newValue,
                    }));
                  }}
                  aria-label="Diminuir %"
                >
                  ▼
                </button>
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "#888",
                  marginLeft: 8,
                  position: "relative",
                }}
              >
                {percent > 0 ? "+" : ""}
                {percent}%
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiTag className={styles.labelIcon} />
              MOTIVO DA BAIXA
            </label>
            <div className={styles.reasonDropdown} ref={reasonRef}>
              <button
                type="button"
                className={`${styles.select} ${styles.reasonTrigger}`}
                onClick={() => setReasonOpen((o) => !o)}
              >
                {form.reason}
              </button>
              {reasonOpen && (
                <div className={styles.reasonList}>
                  {REASONS.map((r) => (
                    <div
                      key={r}
                      className={`${styles.reasonOption} ${form.reason === r ? styles.reasonOptionActive : ""}`}
                      onClick={() => {
                        setForm((f) => ({ ...f, reason: r }));
                        setReasonOpen(false);
                      }}
                    >
                      <span className={styles.reasonOptionLabel}>{r}</span>
                      <div
                        className={styles.reasonTooltipWrap}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiHelpCircle className={styles.reasonTooltipIcon} />
                        <div className={styles.reasonTooltip}>
                          <p>{REASONS_INFO[r].desc}</p>
                          <p>{REASONS_INFO[r].example}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiCreditCard className={styles.labelIcon} />
              FORMA DE PAGAMENTO
            </label>
            <select
              className={styles.select}
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentMethod: e.target.value }))
              }
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiUser className={styles.labelIcon} />
              RESPONSÁVEL
            </label>
            <div className={styles.reasonDropdown} ref={responsibleRef}>
              <button
                type="button"
                className={`${styles.select} ${styles.reasonTrigger}`}
                onClick={() => setResponsibleOpen((o) => !o)}
                style={
                  error && !form.responsible.trim()
                    ? {
                        borderColor: "#ef4444",
                        boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)",
                      }
                    : {}
                }
              >
                {form.responsible || "Selecione o responsável"}
              </button>
              {responsibleOpen && (
                <div className={styles.reasonList}>
                  {RESPONSIBLE_LIST.map((r) => (
                    <div
                      key={r}
                      className={`${styles.reasonOption} ${form.responsible === r ? styles.reasonOptionActive : ""}`}
                      onClick={() => {
                        setForm((f) => ({ ...f, responsible: r }));
                        setResponsibleOpen(false);
                        setError("");
                      }}
                    >
                      <span className={styles.reasonOptionLabel}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.fieldGroupFull}>
          <label className={styles.label}>
            <FiTag className={styles.labelIcon} />
            OBSERVAÇÃO (opcional)
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Alguma observação sobre esta baixa..."
            rows={2}
            value={form.observation}
            onChange={(e) =>
              setForm((f) => ({ ...f, observation: e.target.value }))
            }
          />
        </div>

        <div className={styles.operatorBadge}>
          <div className={styles.operatorLeft}>
            <FiShield className={styles.operatorIcon} />
            <div>
              <span className={styles.operatorTitle}>
                Operação registrada por
              </span>
              <span className={styles.operatorName}>
                {form.responsible || "—"}
              </span>
            </div>
          </div>
          {operatorEmail && (
            <span className={styles.operatorEmail}>{operatorEmail}</span>
          )}
        </div>

        {error && (
          <div className={styles.errorMsg}>
            <FiAlertTriangle />
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.confirmBtn}
            type="submit"
            onClick={handleConfirm}
          >
            {loading ? (
              <CircularProgress
                size={20}
                color="inherit"
                className={styles.loading}
              />
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <FiCheckCircle />
                Confirmar Baixa
              </div>
            )}
          </button>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>

        <p className={styles.disclaimer}>
          Ao confirmar, o item será removido permanentemente do estoque
          disponível.
        </p>
      </div>
    </div>,
    document.body,
  );
}
