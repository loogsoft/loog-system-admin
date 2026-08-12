import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./ConfirmActionModal.module.css";

type ConfirmActionModalVariant = "danger" | "warning" | "success" | "info";

type ConfirmActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmActionModalVariant;
  isLoading?: boolean;
};

const variantIconMap: Record<ConfirmActionModalVariant, LucideIcon> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  itemName,
  warning,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const Icon = variantIconMap[variant];
  const variantClass =
    variant.charAt(0).toUpperCase() + variant.slice(1);

  const handleConfirm = () => {
    void Promise.resolve(onConfirm())
      .catch((error) => {
        console.error(error);
      })
      .finally(onClose);
  };

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div
          className={`${styles.iconWrapper} ${
            styles[`iconWrapper${variantClass}`]
          }`}
        >
          <Icon className={`${styles.icon} ${styles[`icon${variantClass}`]}`} />
        </div>

        <h2 className={styles.title}>{title}</h2>

        <p className={styles.message}>{message}</p>

        {itemName ? <p className={styles.itemName}>{itemName}</p> : null}

        {warning ? <p className={styles.warning}>{warning}</p> : null}

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${
              styles[`confirmBtn${variantClass}`]
            }`}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
