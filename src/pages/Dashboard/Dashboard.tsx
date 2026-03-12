import { useEffect, useMemo, useState, type JSX } from "react";
import styles from "./Dashboard.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  FiAlertTriangle,
  FiAward,
  FiBox,
  FiDollarSign,
  FiSearch,
  FiShoppingCart,
} from "react-icons/fi";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { useTheme } from "../../contexts/useTheme";
import StatCard from "../../components/StatCard/StatCard";
import { ProductService } from "../../service/Product.service";
import { StockMovementService } from "../../service/Stock-movement.service";
import type { StockMovementResponseDto } from "../../dtos/response/stock-movement-response.dto";

type MetricCard = {
  label: string;
  value: string;
  badge: string;
  icon: "money" | "discountStock" | "ticket" | "top";
  sub?: string;
  badgeTone?: "success" | "neutral";
};

type Period = "day" | "week" | "month";

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
};

const METRIC_ICONS: Record<MetricCard["icon"], JSX.Element> = {
  money: <FiDollarSign />,
  discountStock: <FiShoppingCart />,
  ticket: <FiBox />,
  top: <FiAward />,
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      <div className={styles.tooltipValue}>R$ {(value * 13).toFixed(2)}</div>
    </div>
  );
}

export function Dashboard() {
  const [period, setPeriod] = useState<Period>("week");
  const { theme } = useTheme();
  const [stockiten, setStockIten] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [recentMovements, setRecentMovements] = useState<
    StockMovementResponseDto[]
  >([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const periodMovements = useMemo(() => {
    const now = new Date();
    return recentMovements.filter((m) => {
      const d = new Date(m.createdAt);
      if (period === "day") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      if (period === "week") {
        return now.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });
  }, [recentMovements, period]);

  const totalVendas = useMemo(
    () =>
      periodMovements
        .filter((m) => m.type === "OUT")
        .reduce((acc, m) => acc + m.quantity, 0),
    [periodMovements],
  );

  const totalFaturamento = useMemo(
    () =>
      periodMovements
        .filter((m) => m.type === "OUT")
        .reduce((acc, m) => acc + Number(m.price || m.variation?.price || 0), 0),
    [periodMovements],
  );
  const chartColors = {
    primary: "var(--highlight-primary)",
    secondary: "var(--highlight-secondary)",
    muted: "var(--text-muted)",
    grid: "var(--border-default)",
  };

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};

    periodMovements
      .filter((m) => m.type === "OUT")
      .forEach((m) => {
        const d = new Date(m.createdAt);
        let key = "";

        if (period === "day") {
          key = `${String(d.getHours()).padStart(2, "0")}h`;
        }

        if (period === "week") {
          const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
          key = days[d.getDay()];
        }

        if (period === "month") {
          const week = Math.ceil(d.getDate() / 7);
          key = `SEM ${week}`;
        }

        map[key] = (map[key] || 0) + m.quantity;
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [periodMovements, period]);
  useEffect(() => {
    try {
      const totalProduct: any = async () => {
        const data = await ProductService.findAll();
        setStockIten(data.length);

        const low = data.filter(
          (p) => p.isActiveStock && (p.stock ?? 0) <= p.lowStock,
        );
        setLowStock(low.length);
      };
      totalProduct();
    } catch (error) {}
  }, []);

  useEffect(() => {
    StockMovementService.findAll()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentMovements(sorted);
      })
      .catch(() => {});
  }, []);

  const filteredMovements = useMemo(() => {
    let list = recentMovements;
    if (typeFilter !== "all") {
      list = list.filter((m) => m.type === typeFilter);
    }
    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
      list = list.filter(
        (m) =>
          (m.responsibleName || "").toLowerCase().includes(trimmed) ||
          (m.productName || m.variation?.name || "")
            .toLowerCase()
            .includes(trimmed) ||
          m.id.toLowerCase().includes(trimmed),
      );
    }
    return list;
  }, [recentMovements, query, typeFilter]);

  const totalMovements = filteredMovements.length;
  const maxPageMovements = Math.max(1, Math.ceil(totalMovements / pageSize));
  const currentPage = Math.min(page, maxPageMovements);
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  const movementPages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(maxPageMovements, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, maxPageMovements]);


  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>Dashboard Executivo</h1>
          <p className={styles.subtitle}>
            Bem-vindo de volta. Veja o desempenho do periodo selecionado.
          </p>
        </div>

        <div className={styles.actions}>
          <div className={styles.periodTabs}>
            <button
              className={`${styles.periodTab} ${
                period === "day" ? styles.periodTabActive : ""
              }`}
              type="button"
              onClick={() => setPeriod("day")}
            >
              Dia
            </button>
            <button
              className={`${styles.periodTab} ${
                period === "week" ? styles.periodTabActive : ""
              }`}
              type="button"
              onClick={() => setPeriod("week")}
            >
              Semana
            </button>
            <button
              className={`${styles.periodTab} ${
                period === "month" ? styles.periodTabActive : ""
              }`}
              type="button"
              onClick={() => setPeriod("month")}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <StatCard
          label="VENDAS TOTAIS"
          value={totalVendas.toLocaleString("pt-BR")}
          icon={METRIC_ICONS["discountStock"]}
          badgeTone="success"
          iconColor="#EFF6FF"
          iconBackgroundColor="#3B82F6"
          valueColor="#3B82F6"
        />
        <StatCard
          label="FATURAMENTO"
          value={totalFaturamento.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          icon={METRIC_ICONS["money"]}
          badgeTone="success"
          iconColor="#ECFDF5"
          iconBackgroundColor="#059669"
          valueColor="#059669"
        />
        <StatCard
          key={1}
          label={"ITENS EM ESTOQUE"}
          icon={METRIC_ICONS["ticket"]}
          value={stockiten.toString()}
          badgeTone={"success"}
          iconColor="#FFFBEB"
          iconBackgroundColor="#F59E0B"
          valueColor="#F59E0B"
        />
        <StatCard
          label="ESTOQUE BAIXO"
          value={lowStock}
          icon={<FiAlertTriangle />}
          iconColor="#FFFBEB"
          iconBackgroundColor="#f50b0bd7"
          valueColor="#f50b0bd7"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Performance de Vendas</div>
            <div className={styles.panelSub}>
              Análise comparativa de volume diário
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              {period === "day"
                ? "Hoje"
                : period === "week"
                  ? "Esta Semana"
                  : "Este Mês"}
            </span>
          </div>
        </div>

        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              key={theme}
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 6 }}
            >
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={chartColors.primary}
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColors.secondary}
                    stopOpacity={0.9}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: chartColors.muted, fontSize: 11 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="url(#barFill)"
                radius={[12, 12, 12, 12]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Movimentações Recentes</div>
        </div>

        <div className={styles.filters}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className={styles.search}>
              <FiSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar por responsável, produto ou ID..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <CustomSelect
              options={[5, 10, 20, 50].map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              value={String(pageSize)}
              onChange={(v: string) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            />
          </div>
          <div className={styles.filterActions}>
            <CustomSelect
              options={[
                { value: "all", label: "Todos" },
                { value: "OUT", label: "Saída" },
                { value: "IN", label: "Entrada" },
              ]}
              value={typeFilter}
              onChange={(v: string) => {
                setTypeFilter(v);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.thead}`}>
            <div>PRODUTO</div>
            <div>DATA/HORA</div>
            <div>RESPONSÁVEL</div>
            <div>VARIAÇÃO</div>
            <div className={styles.qtdValorCell}>
              <span>QTD</span>
              <span>VALOR</span>
              <span>FORMA DE PAGAMENTO</span>
            </div>
            <div>MOTIVO</div>
            <div>TIPO</div>
          </div>

          {paginatedMovements.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              Nenhuma movimentação encontrada.
            </div>
          ) : (
            paginatedMovements.map((r) => {
              const dt = new Date(r.createdAt);
              const date = dt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              });
              const time = dt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const initials = (r.responsibleName || "?")
                .split(" ")
                .slice(0, 2)
                .map((p: string) => p[0]?.toUpperCase() ?? "")
                .join("");
              return (
                <div key={r.id} className={styles.row}>
                  <div className={styles.idCell}>
                    {r.productName || r.variation?.name || "-"}
                  </div>
                  <div className={styles.dateCell}>
                    <div>{date}</div>
                    <div className={styles.muted}>{time}</div>
                  </div>
                  <div className={styles.clientCell}>
                    <div className={styles.avatar}>{initials}</div>
                    <div className={styles.clientName}>
                      {r.responsibleName || "-"}
                    </div>
                  </div>
                  <div className={styles.productsCell}>
                    {r.variation?.color && (
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: r.variation.color }}
                      />
                    )}
                    {r.variation?.size || "-"}
                  </div>
                  <div className={styles.qtdValorCell}>
                    <span className={styles.totalCell}>{r.quantity}x</span>
                    <span className={styles.valueCell}>
                      R$
                      {r.price.length > 5
                        ? r.price.slice(0, 4) + "..."
                        : r.price || "-"}
                    </span>
                    <span className={styles.paymentCell}>
                      {r.paymentMethod || "-"}
                    </span>
                  </div>
                  <div className={styles.reasonCell}>{r.reason || "-"}</div>
                  <div>
                    <span
                      className={
                        r.type === "OUT" ? styles.statusOk : styles.statusBad
                      }
                    >
                      {r.type === "OUT" ? "SAÍDA" : "ENTRADA"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.bottom}>
          <div className={styles.counter}>
            Mostrando {paginatedMovements.length} de {totalMovements}{" "}
            movimentações
          </div>
          <div className={styles.pagination}>
            <button
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.pageBtnDisabled : ""}`}
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              ‹
            </button>
            {movementPages.map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ""}`}
                type="button"
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={`${styles.pageBtn} ${currentPage === maxPageMovements ? styles.pageBtnDisabled : ""}`}
              type="button"
              onClick={() =>
                setPage(Math.min(maxPageMovements, currentPage + 1))
              }
              disabled={currentPage === maxPageMovements}
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
