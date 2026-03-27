import styles from "./Credit.module.css";
import { useEffect, useMemo, useState } from "react";
import { FiBox, FiSearch } from "react-icons/fi";
import { SkeletonCard } from "../../components/SkeletonCard/SkeletonCard";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/StatCard/StatCard";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { useAuth } from "../../contexts/useAuth";
import { CreditCustomerService } from "../../service/Credit-customer.service";
import type { CreditCustomerResponseDto } from "../../dtos/response/credit-customer-response.dto";
import EntityCard from "../../components/EntityCard/EntityCard";

export function Credit() {
  const [creditCustomer, setCreditCustomer] = useState<
    CreditCustomerResponseDto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [view, setView] = useState<"creditOpen" | "creditCustomers">(
    "creditOpen",
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId;

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return creditCustomer;
    return creditCustomer.filter(
      (c) =>
        c.customerName.toLowerCase().includes(trimmed) ||
        c.customerEmail.toLowerCase().includes(trimmed),
    );
  }, [creditCustomer, query]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const pages = Array.from({ length: maxPage }, (_, index) => index + 1);
  const counts = useMemo(
    () => ({ all: creditCustomer.length }),
    [creditCustomer],
  );
  const LISTPAG: { value: number }[] = useMemo(
    () => [{ value: 12 }, { value: 24 }, { value: 48 }, { value: 100 }],
    [],
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      if (companyId)
        try {
          setLoading(true);
          setError(null);
          const data = await CreditCustomerService.findAll(companyId);
          setCreditCustomer(data);
        } catch (err) {
          console.error(err);
          setError("Erro ao carregar clientes");
        } finally {
          setLoading(false);
        }
    };
    fetchCustomers();
  }, [companyId]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestao de Crediarios</h1>
          <p className={styles.subtitle}>
            Gerencie os crediarios, visualize detalhes e mantenha tudo
            atualizado.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.addBtn}
            type="button"
            onClick={() => navigate("/credit-details")}
          >
            <Plus size={16} />
            Abrir Crediario
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <StatCard
          label="TOTAL DE CLIENTES"
          value={counts.all.toLocaleString("pt-BR")}
          icon={<FiBox />}
          valueColor="var(--highlight-primary)"
        />
      </div>

      <section className={styles.tabs}>
        <button
          className={`${styles.tab} ${view === "creditOpen" ? styles.tabActive : ""}`}
          type="button"
          onClick={() => setView("creditOpen")}
        >
          Crediários em aberto
        </button>
        <button
          className={`${styles.tab} ${view === "creditCustomers" ? styles.tabActive : ""}`}
          type="button"
          onClick={() => setView("creditCustomers")}
        >
          Clientes cadastrados
        </button>
      </section>
      <div className={styles.gridContainer}>
        {view === "creditCustomers" ? (
          <>
            <div className={styles.filters}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className={styles.search}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Buscar cliente..."
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                    }}
                  />
                </div>
                <CustomSelect
                  options={LISTPAG.map((c) => ({
                    value: String(c.value),
                    label: String(c.value),
                  }))}
                  value={String(pageSize)}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <div style={{ padding: 12 }}>{error}</div>
            ) : paginated.length === 0 ? (
              <div className={styles.emptyState}>
                <FiBox className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Nenhum cliente encontrado</h3>
                <p className={styles.emptySubtitle}>
                  Tente ajustar os filtros ou adicione novos clientes.
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {paginated.map((c) => (
                  <EntityCard
                    key={c.id}
                    id={c.id}
                    type="creditCustomer"
                    name={c.customerName}
                    category="Cliente"
                    email={c.customerEmail}
                    phone={c.phone}
                    location={
                      [c.road, c.number, c.neighborhood, c.city, c.state, c.zipCode]
                        .filter(Boolean)
                        .join(", ")
                    }
                    initials={c.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                    avatarColor={undefined}
                  />
                ))}
              </div>
            )}

            <div className={styles.bottom}>
              <div className={styles.counter}>
                Mostrando {paginated.length} de {total} clientes
              </div>
              <div className={styles.pagination}>
                <button
                  className={`${styles.pageBtn} ${
                    currentPage === 1 ? styles.pageBtnDisabled : ""
                  }`}
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Pagina anterior"
                >
                  ‹
                </button>
                {pages.map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${
                      p === currentPage ? styles.pageBtnActive : ""
                    }`}
                    type="button"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className={`${styles.pageBtn} ${
                    currentPage === maxPage ? styles.pageBtnDisabled : ""
                  }`}
                  type="button"
                  onClick={() => setPage(Math.min(maxPage, currentPage + 1))}
                  disabled={currentPage === maxPage}
                  aria-label="Proxima pagina"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FiBox className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Nenhum crediário em aberto encontrado</h3>
            <p className={styles.emptySubtitle}>
              Nenhum crediário em aberto para exibir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
