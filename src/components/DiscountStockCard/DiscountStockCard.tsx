import { useNavigate } from "react-router-dom";
import { DiscountStockStatusEnum } from "../../dtos/enums/discount-stock-status.enum";
import styles from "./DiscountStockCard.module.css";
import { FiChevronRight } from "react-icons/fi";

type DiscountStockItem = {
  name: string;
  quantity: number;
};

type Props = {
  stockNumber: string;
  customerName: string;
  minutesAgo: number;
  items: DiscountStockItem[];
  total: number;
  onAccept?: () => void;
  status: DiscountStockStatusEnum;
  navigateTo: string;
};

export function DiscountStockCard({
  stockNumber,
  customerName,
  minutesAgo,
  items,
  total,
  onAccept,
  status,
  navigateTo,
}: Props) {
  const price = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const statusClass =
    {
      [DiscountStockStatusEnum.NEW]: "btnNew",
      [DiscountStockStatusEnum.ON_ROUTE]: "btnOnRoute",
      [DiscountStockStatusEnum.PREPARING]: "btnPreparing",
    }[status] ?? "btnDefault";

  const navigate = useNavigate();
  return (
    <div className={styles.card} onClick={() => navigate(navigateTo)}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.stockNumber}>#{stockNumber}</div>
          <div className={styles.customerName}>{customerName}</div>
        </div>

        <div className={styles.timePill}>{minutesAgo} min</div>
      </div>

      <ul className={styles.items}>
        {items.slice(0, 2).map((it, idx) => (
          <li key={`${it.name}-${idx}`} className={styles.item}>
            <span className={styles.dot} />
            <span className={styles.itemText}>
              {it.quantity}x {it.name}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.price}>{price}</div>

        <button className={styles[statusClass]} onClick={onAccept}>
          {status === DiscountStockStatusEnum.NEW
            ? "Aceitar"
            : status === DiscountStockStatusEnum.PREPARING
              ? "Finalizar"
              : status === DiscountStockStatusEnum.ON_ROUTE
                ? "Concluir"
                : ""}{" "}
          <FiChevronRight className={styles.acceptIcon} />
        </button>
      </div>
    </div>
  );
}
