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

type RecentSale = {
  id: string;
  date: string;
  time: string;
  client: { initials: string };
  clientName: string;
  products: string;
  total: string;
  status: "CONCLUIDO" | "CANCELADO";
};

type Period = "day" | "week" | "month";

type ChartPoint = {
  name: string;
  value: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
};

type PeriodData = {
  metrics: MetricCard[];
  chart: ChartPoint[];
  recent: RecentSale[];
};

const DASHBOARD_MOCK: Record<Period, PeriodData> = {
  day: {
    metrics: [
      {
        label: "VENDAS TOTAIS",
        value: "128",
        badge: "+3.1%",
        icon: "discountStock",
        badgeTone: "success",
      },
      {
        label: "FATURAMENTO",
        value: "R$ 6.420",
        badge: "+1.4%",
        icon: "money",
        badgeTone: "success",
      },
    ],
    chart: [
      { name: "08h", value: 12 },
      { name: "10h", value: 18 },
      { name: "12h", value: 32 },
      { name: "14h", value: 26 },
      { name: "16h", value: 22 },
      { name: "18h", value: 41 },
      { name: "20h", value: 33 },
    ],
    recent: [
      {
        id: "#99102",
        date: "09 Fev",
        time: "19:42",
        client: { initials: "RM" },
        clientName: "Ricardo Mendes",
        products: "1x Camisa Polo, 1x Cinto Couro",
        total: "R$ 54,90",
        status: "CONCLUIDO",
      },
      {
        id: "#99101",
        date: "09 Fev",
        time: "19:30",
        client: { initials: "AS" },
        clientName: "Amanda Silva",
        products: "2x Camiseta Basica, 1x Calca Jeans",
        total: "R$ 82,00",
        status: "CONCLUIDO",
      },
      {
        id: "#99098",
        date: "09 Fev",
        time: "19:25",
        client: { initials: "JO" },
        clientName: "João Oliveira",
        products: "1x Jaqueta Corta Vento, 1x Mochila",
        total: "R$ 42,50",
        status: "CANCELADO",
      },
      {
        id: "#99094",
        date: "09 Fev",
        time: "19:10",
        client: { initials: "CP" },
        clientName: "Carla P.",
        products: "3x Camiseta Infantil",
        total: "R$ 115,00",
        status: "CONCLUIDO",
      },
    ],
  },
  week: {
    metrics: [
      {
        label: "VENDAS TOTAIS",
        value: "4,289",
        badge: "+12.5%",
        icon: "discountStock",
        badgeTone: "success",
      },
      {
        label: "FATURAMENTO",
        value: "R$ 158.240",
        badge: "+8.2%",
        icon: "money",
        badgeTone: "success",
      },
    ],
    chart: [
      { name: "SEG", value: 48 },
      { name: "TER", value: 64 },
      { name: "QUA", value: 58 },
      { name: "QUI", value: 92 },
      { name: "SEX", value: 24 },
      { name: "SAB", value: 96 },
      { name: "DOM", value: 86 },
    ],
    recent: [
      {
        id: "#88421",
        date: "12 Out",
        time: "19:42",
        client: { initials: "RM" },
        clientName: "Ricardo Mendes",
        products: "1x Camisa Polo, 1x Cinto Couro",
        total: "R$ 54,90",
        status: "CONCLUIDO",
      },
      {
        id: "#88428",
        date: "12 Out",
        time: "19:30",
        client: { initials: "AS" },
        clientName: "Amanda Silva",
        products: "2x Camiseta Basica, 1x Calca Jeans",
        total: "R$ 82,00",
        status: "CONCLUIDO",
      },
      {
        id: "#88419",
        date: "12 Out",
        time: "19:25",
        client: { initials: "JO" },
        clientName: "Joao Oliveira",
        products: "1x Jaqueta Corta Vento, 1x Mochila",
        total: "R$ 42,50",
        status: "CANCELADO",
      },
      {
        id: "#88418",
        date: "12 Out",
        time: "19:10",
        client: { initials: "CP" },
        clientName: "Carla P.",
        products: "3x Camiseta Infantil",
        total: "R$ 115,00",
        status: "CONCLUIDO",
      },
    ],
  },
  month: {
    metrics: [
      {
        label: "VENDAS TOTAIS",
        value: "18,902",
        badge: "+6.8%",
        icon: "discountStock",
        badgeTone: "success",
      },
      {
        label: "FATURAMENTO",
        value: "R$ 612.980",
        badge: "+4.1%",
        icon: "money",
        badgeTone: "success",
      },
    ],
    chart: [
      { name: "SEM 1", value: 210 },
      { name: "SEM 2", value: 248 },
      { name: "SEM 3", value: 226 },
      { name: "SEM 4", value: 268 },
    ],
    recent: [
      {
        id: "#87021",
        date: "02 Fev",
        time: "12:16",
        client: { initials: "FP" },
        clientName: "Felipe Pereira",
        products: "2x Moletom, 1x Bone",
        total: "R$ 96,40",
        status: "CONCLUIDO",
      },
      {
        id: "#87013",
        date: "01 Fev",
        time: "18:03",
        client: { initials: "LL" },
        clientName: "Larissa Lima",
        products: "1x Vestido Midi, 1x Bolsa",
        total: "R$ 84,90",
        status: "CONCLUIDO",
      },
      {
        id: "#86988",
        date: "29 Jan",
        time: "20:10",
        client: { initials: "CB" },
        clientName: "Carlos Braga",
        products: "2x Camisa Social",
        total: "R$ 74,00",
        status: "CANCELADO",
      },
      {
        id: "#86975",
        date: "28 Jan",
        time: "19:22",
        client: { initials: "DM" },
        clientName: "Diana M.",
        products: "1x Jaqueta Jeans, 1x Shorts",
        total: "R$ 68,00",
        status: "CONCLUIDO",
      },
    ],
  },
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
  const [recentMovements, setRecentMovements] = useState<StockMovementResponseDto[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const periodData = useMemo(() => DASHBOARD_MOCK[period], [period]);

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
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [recentMovements, period]);

  const totalVendas = useMemo(
    () => periodMovements.filter((m) => m.type === "OUT").reduce((acc, m) => acc + m.quantity, 0),
    [periodMovements]
  );

  const totalFaturamento = useMemo(
    () =>
      periodMovements
        .filter((m) => m.type === "OUT")
        .reduce((acc, m) => acc + m.quantity * Number(m.variation?.price ?? 0), 0),
    [periodMovements]
  );
  const chartColors = {
    primary: "var(--highlight-primary)",
    secondary: "var(--highlight-secondary)",
    muted: "var(--text-muted)",
    grid: "var(--border-default)",
  };

  useEffect(() => {
    try {
      const totalProduct: any = async () => {
        const data = await ProductService.findAll();
        setStockIten(data.length);
      };
      totalProduct();
    } catch (error) {}
  }, []);

  useEffect(() => {
    StockMovementService.findAll()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
          (m.variation?.name || "").toLowerCase().includes(trimmed) ||
          m.id.toLowerCase().includes(trimmed)
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
        />
        <StatCard
          label="FATURAMENTO"
          value={totalFaturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={METRIC_ICONS["money"]}
          badgeTone="success"
        />
        <StatCard
          key={1}
          label={"ITENS EM ESTOQUE"}
          icon={METRIC_ICONS["ticket"]}
          value={stockiten.toString()}
          badgeTone={"success"}
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
            <span className={styles.legendItem}>HOJE</span>
            <span className={`${styles.legendItem} ${styles.legendMuted}`}>
              ONTEM
            </span>
          </div>
        </div>

        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              key={theme}
              data={periodData.chart}
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
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <CustomSelect
              options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))}
              value={String(pageSize)}
              onChange={(v: string) => { setPageSize(Number(v)); setPage(1); }}
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
              onChange={(v: string) => { setTypeFilter(v); setPage(1); }}
            />
          </div>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.thead}`}>
            <div>ID</div>
            <div>DATA/HORA</div>
            <div>RESPONSÁVEL</div>
            <div>PRODUTO</div>
            <div>QTD</div>
            <div>MOTIVO</div>
            <div>TIPO</div>
          </div>

          {paginatedMovements.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Nenhuma movimentação encontrada.</div>
          ) : (
            paginatedMovements.map((r) => {
              const dt = new Date(r.createdAt);
              const date = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
              const time = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const initials = (r.responsibleName || "?")
                .split(" ")
                .slice(0, 2)
                .map((p: string) => p[0]?.toUpperCase() ?? "")
                .join("");
              return (
                <div key={r.id} className={styles.row}>
                  <div className={styles.idCell}>#{r.id.slice(0, 8)}</div>
                  <div className={styles.dateCell}>
                    <div>{date}</div>
                    <div className={styles.muted}>{time}</div>
                  </div>
                  <div className={styles.clientCell}>
                    <div className={styles.avatar}>{initials}</div>
                    <div className={styles.clientName}>{r.responsibleName || "-"}</div>
                  </div>
                  <div className={styles.productsCell}>{r.variation?.name || "-"}</div>
                  <div className={styles.totalCell}>{r.quantity}x</div>
                  <div>{r.reason || "-"}</div>
                  <div>
                    <span className={r.type === "OUT" ? styles.statusOk : styles.statusBad}>
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
            Mostrando {paginatedMovements.length} de {totalMovements} movimentações
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
              onClick={() => setPage(Math.min(maxPageMovements, currentPage + 1))}
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
