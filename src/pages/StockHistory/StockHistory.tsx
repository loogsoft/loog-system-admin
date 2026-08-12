import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiDollarSign,
  FiPackage,
  FiRefreshCcw,
  FiShoppingBag,
  FiTrendingDown,
} from "react-icons/fi";
import StatCard from "../../components/StatCard/StatCard";
import { StockOperationsTable } from "../../components/StockOperationsTable/StockOperationsTable";
import type { StockMovementResponseDto } from "../../dtos/response/stock-movement-response.dto";
import type { StockOperationResponseDto } from "../../dtos/response/stock-operation-response.dto";
import { StockMovementService } from "../../service/Stock-movement.service";
import styles from "./StockHistory.module.css";

type PeriodFilter = "today" | "week" | "month" | "all";

const periodOptions: { label: string; value: PeriodFilter }[] = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "week" },
  { label: "30 dias", value: "month" },
  { label: "Tudo", value: "all" },
];

function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatQuantity(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

function getMovementTotal(movement: StockMovementResponseDto) {
  const storedPrice = toNumber(movement.price);

  if (storedPrice > 0) {
    return storedPrice;
  }

  return (
    toNumber(movement.variation?.price ?? movement.product?.price) *
    toNumber(movement.quantity)
  );
}

function getPeriodStart(period: PeriodFilter) {
  if (period === "all") return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    start.setDate(start.getDate() - 6);
  }

  if (period === "month") {
    start.setDate(start.getDate() - 29);
  }

  return start;
}

function getProductKey(movement: StockMovementResponseDto) {
  return (
    movement.variationId ||
    movement.variation?.id ||
    movement.productId ||
    movement.product?.id ||
    movement.productName
  );
}

function getPaymentMethodSummary(operations: StockOperationResponseDto[]) {
  const map = new Map<string, number>();

  operations.forEach((operation) => {
    const key = operation.paymentMethod || "Nao informado";
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  const [paymentMethod, total] =
    [...map.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  return paymentMethod ? `${paymentMethod} (${total})` : "Sem registro";
}

export function StockHistory() {
  const [operations, setOperations] = useState<StockOperationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("month");

  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StockMovementService.findAllOperations();
      setOperations(data);
    } catch (err) {
      console.error(err);
      setError("Nao foi possivel carregar o historico de baixas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const outOperations = useMemo(
    () => operations.filter((operation) => operation.type === "OUT"),
    [operations],
  );

  const filteredOperations = useMemo(() => {
    const start = getPeriodStart(period);
    if (!start) return outOperations;

    return outOperations.filter(
      (operation) => new Date(operation.createdAt) >= start,
    );
  }, [outOperations, period]);

  const movements = useMemo(
    () => filteredOperations.flatMap((operation) => operation.movements ?? []),
    [filteredOperations],
  );

  const report = useMemo(() => {
    const totalQuantity = movements.reduce(
      (total, movement) => total + toNumber(movement.quantity),
      0,
    );
    const revenue = movements.reduce(
      (total, movement) => total + getMovementTotal(movement),
      0,
    );
    const movedProducts = new Set(movements.map(getProductKey)).size;
    const averageTicket =
      filteredOperations.length > 0 ? revenue / filteredOperations.length : 0;

    return {
      totalQuantity,
      revenue,
      movedProducts,
      averageTicket,
      paymentSummary: getPaymentMethodSummary(filteredOperations),
    };
  }, [filteredOperations, movements]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Estoque / Relatorio</span>
          <h1 className={styles.title}>Historico de baixas</h1>
          <p className={styles.subtitle}>
            Acompanhe saidas, faturamento e produtos movimentados no estoque.
          </p>
        </div>

        <button
          className={styles.refreshButton}
          type="button"
          onClick={fetchOperations}
          disabled={loading}
        >
          <FiRefreshCcw />
          Atualizar
        </button>
      </header>

      <div className={styles.periodTabs}>
        {periodOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.periodTab} ${
              period === option.value ? styles.periodTabActive : ""
            }`}
            type="button"
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className={styles.metrics}>
        <StatCard
          label="Baixas registradas"
          value={loading ? "..." : filteredOperations.length}
          sub="Operacoes no periodo"
          icon={<FiTrendingDown />}
          iconColor="#EFF6FF"
          iconBackgroundColor="#2563EB"
          valueColor="#2563EB"
        />
        <StatCard
          label="Unidades baixadas"
          value={loading ? "..." : `${formatQuantity(report.totalQuantity)} un`}
          sub="Quantidade total retirada"
          icon={<FiPackage />}
          iconColor="#FEF3C7"
          iconBackgroundColor="#D97706"
          valueColor="#D97706"
        />
        <StatCard
          label="Faturamento"
          value={loading ? "..." : formatBRL(report.revenue)}
          sub="Valor das baixas"
          icon={<FiDollarSign />}
          iconColor="#ECFDF5"
          iconBackgroundColor="#059669"
          valueColor="#059669"
        />
        <StatCard
          label="Ticket medio"
          value={loading ? "..." : formatBRL(report.averageTicket)}
          sub="Media por operacao"
          icon={<FiShoppingBag />}
          iconColor="#F3E8FF"
          iconBackgroundColor="#8B5CF6"
          valueColor="#8B5CF6"
        />
      </section>

      <section className={styles.reportStrip}>
        <div>
          <span>Produtos movimentados</span>
          <strong>{loading ? "..." : report.movedProducts}</strong>
        </div>
        <div>
          <span>Forma mais usada</span>
          <strong>{loading ? "..." : report.paymentSummary}</strong>
        </div>
        <div>
          <span>Ultima atualizacao</span>
          <strong>
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <div>
            <h2>Operacoes de baixa</h2>
            <p>Lista detalhada das saidas registradas no estoque.</p>
          </div>
          <FiClock />
        </div>

        <StockOperationsTable
          operations={filteredOperations}
          pageSizeOptions={[6, 12, 24, 48]}
          initialPageSize={6}
          emptyTitle="Nenhuma baixa encontrada"
          emptySubtitle="Nao existem saidas registradas para o periodo selecionado."
          showTypeFilter={false}
        />
      </section>
    </div>
  );
}
