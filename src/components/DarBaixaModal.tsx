import { useState } from "react";
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
} from "react-icons/fi";
import styles from "./DarBaixaModal.module.css";
import type { ProductResponse } from "../dtos/response/product-response.dto";
import { useAuth } from "../contexts/useAuth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: ProductResponse | null;
  onConfirm: (data: BaixaFormData) => void;
};

export type BaixaFormData = {
  quantity: number;
  reason: string;
  paymentMethod: string;
  responsible: string;
  observation: string;
  operatorEmail: string;
};

const REASONS = ["Venda", "Avaria", "Consumo interno", "Devolução", "Perda"];
const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência", "N/A"];

export function DarBaixaModal({ isOpen, onClose, product, onConfirm }: Props) {
  const { user } = useAuth();
  const operatorLabel = user?.name || user?.email || "Usuário desconhecido";
  const operatorEmail = user?.email || "";

  const [form, setForm] = useState({
    quantity: 1,
    reason: "Venda",
    paymentMethod: "PIX",
    responsible: "",
    observation: "",
  });
  const [error, setError] = useState("");

  if (!isOpen || !product) return null;

  const currentStock = product.stock ?? 0;
  const isOverStock = form.quantity > currentStock;
  const isZero = form.quantity <= 0;

  const handleConfirm = () => {
    if (!form.responsible.trim()) {
      setError("Informe o responsável pela baixa.");
      return;
    }
    if (isZero) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }
    if (isOverStock) {
      setError("Quantidade maior que o estoque disponível.");
      return;
    }
    setError("");
    onConfirm({ ...form, operatorEmail });
    onClose();
    setForm({ quantity: 1, reason: "Venda", paymentMethod: "PIX", responsible: "", observation: "" });
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
              <img src={product.images[0].url} alt={product.name} className={styles.productImg} />
            ) : (
              <FiPackage className={styles.productIcon} />
            )}
          </div>
          <div className={styles.productInfo}>
            <div className={styles.productName}>{product.name}</div>
            <div className={styles.productCategory}>{product.category}</div>
            <div className={styles.stockRow}>
              <span className={`${styles.stockDot} ${currentStock <= product.lowStock ? styles.stockDotLow : styles.stockDotOk}`} />
              <span className={styles.stockText}>
                {currentStock} em estoque
              </span>
            </div>
          </div>
          {!isZero && !isOverStock && (
            <div className={styles.stockAfterBadge}>
              <span className={styles.stockAfterLabel}>Após a baixa</span>
              <span className={`${styles.stockAfterValue} ${stockAfter <= product.lowStock ? styles.stockAfterLow : ""}`}>
                {stockAfter}
              </span>
            </div>
          )}
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
              MOTIVO DA BAIXA
            </label>
            <select
              className={styles.select}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiCreditCard className={styles.labelIcon} />
              FORMA DE PAGAMENTO
            </label>
            <select
              className={styles.select}
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FiUser className={styles.labelIcon} />
              RESPONSÁVEL
            </label>
            <input
              className={`${styles.input} ${error && !form.responsible.trim() ? styles.inputError : ""}`}
              type="text"
              placeholder="Nome do responsável"
              value={form.responsible}
              onChange={(e) => {
                setError("");
                setForm((f) => ({ ...f, responsible: e.target.value }));
              }}
            />
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
            onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
          />
        </div>

        <div className={styles.operatorBadge}>
          <div className={styles.operatorLeft}>
            <FiShield className={styles.operatorIcon} />
            <div>
              <span className={styles.operatorTitle}>Operação registrada por</span>
              <span className={styles.operatorName}>{operatorLabel}</span>
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
          <button className={styles.confirmBtn} type="button" onClick={handleConfirm}>
            <FiCheckCircle />
            Confirmar Baixa
          </button>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>

        <p className={styles.disclaimer}>
          Ao confirmar, o item será removido permanentemente do estoque disponível.
        </p>
      </div>
    </div>,
    document.body,
  );
}
