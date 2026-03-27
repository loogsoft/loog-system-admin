import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./ConfirmDeleteModal.module.css";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Remover item",
  message = "Tem certeza que deseja remover este item?",
  itemName,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <AlertTriangle className={styles.icon} />
        </div>
        
        <h2 className={styles.title}>{title}</h2>
        
        <p className={styles.message}>{message}</p>
        
        {itemName && (
          <p className={styles.itemName}>{itemName}</p>
        )}
        
        <p className={styles.warning}>Esta ação não pode ser desfeita.</p>
        
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Remover
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
