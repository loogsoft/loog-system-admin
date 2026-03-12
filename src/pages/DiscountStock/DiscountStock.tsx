import { useEffect, useMemo, useState } from "react";
import styles from "./DiscountStock.module.css";
import {
  FiDollarSign,
  FiFilter,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import StatCard from "../../components/StatCard/StatCard";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { DiscountStockFilterModal } from "../../components/DiscountStockFilterModal";
import EntityCard from "../../components/EntityCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { ProductService } from "../../service/Product.service";
import type { ProductResponse } from "../../dtos/response/product-response.dto";
import { ProductStatusEnum } from "../../dtos/enums/product-status.enum";
import { DarBaixaModal } from "../../components/DarBaixaModal";
import { VoltarEstoqueModal } from "../../components/VoltarEstoqueModal";
import { StockMovementService } from "../../service/Stock-movement.service";

type StockLevel = "all" | "ok" | "low" | "critical";
type SortOption = "alpha" | "priceAsc" | "priceDesc" | "stockAsc" | "stockDesc";

const getStockLevel = (p: ProductResponse): "ok" | "low" | "critical" => {
  if (!p.isActiveStock || p.stock === undefined) return "ok";
  if (p.stock === 0) return "critical";
  if (p.stock <= p.lowStock) return "low";
  return "ok";
};

export function DiscountStock() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [darBaixaProduct, setDarBaixaProduct] =
    useState<ProductResponse | null>(null);
  const [voltarEstoqueItem, setVoltarEstoqueItem] = useState<any | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"stock" | "history">("stock");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activedFindAll, setActivedFindAll] = useState(false);

  function alternValue() {
    setActivedFindAll((prev) => !prev);
  }
  const [filters, setFilters] = useState<{
    minPrice: string;
    maxPrice: string;
    minStock: string;
    maxStock: string;
    stockLevel: StockLevel;
    sortBy: SortOption;
  }>({
    minPrice: "",
    maxPrice: "",
    minStock: "",
    maxStock: "",
    stockLevel: "all",
    sortBy: "alpha",
  });

  const totalVendas = useMemo(
    () => stockHistory.reduce((acc, h) => acc + h.quantity, 0),
    [stockHistory],
  );

  const faturamento = useMemo(
    () =>
      products.reduce(
        (acc, p) => acc + Number(p.price ?? 0) * (p.stock ?? 0),
        0,
      ),
    [products],
  );

  const faturamentoFormatted = faturamento.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await ProductService.findAll();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activedFindAll]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await StockMovementService.findAll();
        setStockHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const LISTPAG: { value: number }[] = useMemo(
    () => [{ value: 6 }, { value: 12 }, { value: 24 }, { value: 48 }],
    [],
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).sort();
    return [
      { value: "all", label: `Todos ${products.length}` },
      ...unique.map((cat) => ({ value: cat, label: cat })),
    ];
  }, [products]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    let filtered = products.filter((item) => {
      // Só lista se o produto ou alguma variação tiver estoque > 0
      const mainStock = item.stock ?? 0;
      const variationsStock = Array.isArray(item.variations)
        ? item.variations.some((v) => Number(v.stock ?? 0) > 0)
        : false;
      if (mainStock <= 0 && !variationsStock) return false;

      const matchesSearch = term
        ? `${item.name} ${item.description ?? ""} ${item.category}`
            .toLowerCase()
            .includes(term)
        : true;

      const matchesCategory =
        category === "all" ? true : item.category === category;

      const matchesPrice =
        (!filters.minPrice || Number(item.price) >= Number(filters.minPrice)) &&
        (!filters.maxPrice || Number(item.price) <= Number(filters.maxPrice));

      const matchesStock =
        (!filters.minStock || (item.stock ?? 0) >= Number(filters.minStock)) &&
        (!filters.maxStock || (item.stock ?? 0) <= Number(filters.maxStock));

      const level = getStockLevel(item);
      const matchesLevel =
        filters.stockLevel === "all" || level === filters.stockLevel;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesStock &&
        matchesLevel
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (filters.sortBy === "priceAsc")
        return Number(a.price) - Number(b.price);
      if (filters.sortBy === "priceDesc")
        return Number(b.price) - Number(a.price);
      if (filters.sortBy === "stockAsc") return (a.stock ?? 0) - (b.stock ?? 0);
      if (filters.sortBy === "stockDesc")
        return (b.stock ?? 0) - (a.stock ?? 0);
      return a.name.localeCompare(b.name, "pt-BR");
    });

    return sorted;
  }, [search, category, filters, products]);

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stockHistory;
    return stockHistory.filter((item) => {
      const productName = item.variation?.name || "";
      const responsible = item.responsibleName || "";
      return `${productName} ${item.reason} ${responsible}`
        .toLowerCase()
        .includes(term);
    });
  }, [search, stockHistory]);

  useEffect(() => {
    setPage(1);
  }, [view, search, category, filters]);

  const totalResults =
    view === "stock" ? filteredItems.length : filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedStockItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const pagedHistoryItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dar baixa no estoque</h1>
          <p className={styles.subtitle}>
            Registre saidas, ajuste quantidades e acompanhe o historico.
          </p>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.date}>Seg, 09 Fev 2026</div>
          <button className={styles.primaryBtn} type="button">
            Baixa manual
          </button>
        </div>
      </header>

      <section className={styles.metrics}>
        <StatCard
          label="Total de produtos"
          value={products.length}
          sub="Produtos cadastrados"
          icon={<FiPackage />}
          iconColor="#EFF6FF"
          iconBackgroundColor="#3B82F6"
          valueColor="#3B82F6"
        />
        <StatCard
          label="Total de vendas"
          value={`${totalVendas} un`}
          sub="Unidades vendidas"
          icon={<FiShoppingBag />}
        />
        <StatCard
          label="Faturamento"
          value={faturamentoFormatted}
          sub="Valor em estoque"
          icon={<FiDollarSign />}
          iconColor="#ECFDF5"
          iconBackgroundColor="#059669"
          valueColor="#059669"
        />
      </section>

      <section className={styles.tabs}>
        <button
          className={`${styles.tab} ${view === "stock" ? styles.tabActive : ""}`}
          type="button"
          onClick={() => setView("stock")}
        >
          Produtos em estoque
        </button>
        <button
          className={`${styles.tab} ${view === "history" ? styles.tabActive : ""}`}
          type="button"
          onClick={() => setView("history")}
        >
          Historico de baixas
        </button>
      </section>

      {view === "stock" ? (
        <section className={styles.tablePanel}>
          <div className={styles.filters}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className={styles.search}>
                <FiSearch className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Buscar produto, SKU ou categoria..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
            <div className={styles.filterActions}>
              <CustomSelect
                options={categories}
                value={category}
                onChange={(value) => setCategory(value)}
              />
              <div style={{ position: "relative" }}>
                <button
                  className={styles.filterBtn}
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                >
                  <FiFilter />
                  Filtros
                </button>
                <DiscountStockFilterModal
                  isOpen={isFilterModalOpen}
                  onClose={() => setIsFilterModalOpen(false)}
                  onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                  }}
                  initialFilters={filters}
                />
              </div>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : pagedStockItems.length === 0 ? (
              <div className={styles.emptyState}>
                <FiPackage className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>
                  Nenhum produto em promoção
                </h3>
                <p className={styles.emptySubtitle}>
                  Adicione produtos ao estoque promocional.
                </p>
              </div>
            ) : (
              pagedStockItems.map((item) => (
                <EntityCard
                  key={item.id}
                  id={item.id}
                  type="product"
                  name={item.name}
                  description={item.description}
                  category={item.category}
                  price={item.price}
                  promoPrice={item.promoPrice}
                  imageUrl={[
                    ...(item.images || []),
                    ...(item.variations || [])
                      .filter((v) => v.imageUrl)
                      .map((v) => ({
                        url: v.imageUrl!,
                        fileName: v.name || "",
                        id: "",
                        isPrimary: false,
                      })),
                  ]}
                  stock={item.stock}
                  lowStock={item.lowStock}
                  isActiveStock={item.isActiveStock}
                  available={item.status === ProductStatusEnum.ACTIVED}
                  color={item.color}
                  colors={Array.from(
                    new Set([
                      ...(item.color ? [item.color] : []),
                      ...((item.variations || [])
                        .map((v) => v.color)
                        .filter(Boolean) as string[]),
                    ]),
                  )}
                  size={item.size}
                  sizes={Array.from(
                    new Set([
                      ...(item.size ? [item.size] : []),
                      ...((item.variations || [])
                        .map((v) => v.size)
                        .filter(Boolean) as string[]),
                    ]),
                  )}
                  navigateTo=""
                  status={item.status}
                  variations={item.variations}
                  actionButton={
                    <button
                      className={styles.actionBtn}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDarBaixaProduct(item);
                      }}
                    >
                      Dar baixa
                    </button>
                  }
                />
              ))
            )}
          </div>
          <div className={styles.tableFooter}>
            <div className={styles.tableSummary}>
              Mostrando {pagedStockItems.length} de {totalResults} produtos
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
                  currentPage === totalPages ? styles.pageBtnDisabled : ""
                }`}
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Proxima pagina"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.tablePanel}>
          <div className={styles.filters}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className={styles.search}>
                <FiSearch className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Buscar no historico..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
            <div className={styles.filterActions}>
              <CustomSelect
                options={[
                  { value: "period", label: "Periodo" },
                  { value: "7", label: "Últimos 7 dias" },
                  { value: "30", label: "Últimos 30 dias" },
                ]}
                value="period"
                onChange={() => {}}
              />
              <CustomSelect
                options={[
                  { value: "reason", label: "Motivo" },
                  { value: "Venda", label: "Venda" },
                  { value: "Avaria", label: "Avaria" },
                  { value: "Consumo", label: "Consumo" },
                ]}
                value="reason"
                onChange={() => {}}
              />
            </div>
          </div>
          <div className={styles.cardGrid}>
            {pagedHistoryItems.length === 0 ? (
              <div className={styles.emptyState}>
                <FiShoppingBag className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>
                  Nenhuma movimentação registrada
                </h3>
                <p className={styles.emptySubtitle}>
                  O histórico de baixas aparecerá aqui.
                </p>
              </div>
            ) : (
              pagedHistoryItems.map((item) => (
                <EntityCard
                  key={item.id}
                  id={item.id}
                  type="product"
                  name={item.variation?.name || ""}
                  description={`${item.reason} — ${item.responsibleName}`}
                  category={item.reason as any}
                  price={0}
                  imageUrl={[]}
                  stock={item.quantity}
                  lowStock={0}
                  isActiveStock={false}
                  available={true}
                  navigateTo=""
                  status={ProductStatusEnum.ACTIVED}
                  actionButton={
                    <>
                      <div className={styles.historyOwnerBadge}>
                        <FiUser className={styles.historyOwnerIcon} />
                        <span>{item.responsibleName}</span>
                      </div>
                      <button
                        className={styles.actionOutlineBtn}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVoltarEstoqueItem(item);
                        }}
                      >
                        Voltar ao estoque
                      </button>
                    </>
                  }
                />
              ))
            )}
          </div>
          <div className={styles.tableFooter}>
            <div className={styles.tableSummary}>
              Mostrando {pagedHistoryItems.length} de {totalResults} baixas
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
                  currentPage === totalPages ? styles.pageBtnDisabled : ""
                }`}
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Proxima pagina"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      <DarBaixaModal
        isOpen={darBaixaProduct !== null}
        onClose={() => setDarBaixaProduct(null)}
        product={darBaixaProduct}
        onClick={() => alternValue()}
        onConfirm={(data) => {
          console.log("Baixa confirmada:", data);
          setDarBaixaProduct(null);
        }}
      />
      <VoltarEstoqueModal
        isOpen={voltarEstoqueItem !== null}
        onClose={() => setVoltarEstoqueItem(null)}
        item={voltarEstoqueItem}
        onConfirm={(data) => {
          console.log("Restauração confirmada:", data);
          setVoltarEstoqueItem(null);
        }}
      />
    </div>
  );
}
