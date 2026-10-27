import styles from "./OutOfStock.module.css";
import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiBox,
  FiFilter,
  FiGrid,
  FiSearch,
} from "react-icons/fi";
import EntityCard from "../../components/EntityCard/EntityCard";
import { SkeletonCard } from "../../components/SkeletonCard/SkeletonCard";
import { FilterModal } from "../../components/FilterModal/FilterModal";
import type { CategoryKey } from "../../types/Product-type";
import { ProductService } from "../../service/Product.service";
import type { ProductResponse } from "../../dtos/response/product-response.dto";
import StatCard from "../../components/StatCard/StatCard";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { useLocation, useNavigate } from "react-router-dom";
import { productShouldShowInOutOfStock } from "../../utils/productStock";
import { ProductStatusEnum } from "../../dtos/enums/product-status.enum";

type SortOption = "price-asc" | "price-desc" | "name-asc" | null;
type OutOfStockItem = ProductResponse & {
  productId: string;
  isVariation: boolean;
};

export function OutOfStock() {
  const [activeCat, setActiveCat] = useState<CategoryKey>("all");
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && location.state.id) {
      setQuery(String(location.state.id));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);
  const [filters, setFilters] = useState<{
    minPrice: string;
    maxPrice: string;
    category: CategoryKey;
    sortBy: SortOption;
  }>({
    minPrice: "",
    maxPrice: "",
    category: "all",
    sortBy: null,
  });

  const outOfStockItems = useMemo(() => {
    const items: OutOfStockItem[] = [];

    for (const product of products) {
      if (product.variations?.length) {
        for (const variation of product.variations) {
          if (Number(variation.stock ?? 0) !== 0) continue;

          let images = product.images;
          if (variation.images?.length) {
            images = variation.images;
          } else if (variation.imageUrl) {
            images = [{
              id: variation.id,
              fileName: variation.name,
              url: variation.imageUrl,
              isPrimary: true,
            }];
          }

          items.push({
            ...product,
            id: variation.id,
            productId: product.id,
            isVariation: true,
            price: variation.price ?? product.price,
            promoPrice: undefined,
            images,
            stock: 0,
            lowStock: variation.lowStock,
            color: variation.color,
            size: variation.size,
            status:
              variation.isActive === false
                ? ProductStatusEnum.DISABLED
                : product.status,
            variations: undefined,
          });
        }
      } else if (productShouldShowInOutOfStock(product)) {
        items.push({
          ...product,
          productId: product.id,
          isVariation: false,
        });
      }
    }

    return items;
  }, [products]);

  const filtered = useMemo(() => {
    let current = [...outOfStockItems];

    const categoryToFilter =
      filters.category !== "all" ? filters.category : activeCat;
    if (categoryToFilter !== "all") {
      current = current.filter((p) => p.category === categoryToFilter);
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
      current = current.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.id.toLowerCase().includes(trimmed) ||
          p.productId.toLowerCase().includes(trimmed),
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      current = current.filter((p) => Number(p.price) >= min);
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      current = current.filter((p) => Number(p.price) <= max);
    }

    if (filters.sortBy === "price-asc") {
      current = [...current].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sortBy === "price-desc") {
      current = [...current].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (filters.sortBy === "name-asc") {
      current = [...current].sort((a, b) => a.name.localeCompare(b.name));
    }

    return current;
  }, [activeCat, outOfStockItems, query, filters]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const pages = Array.from({ length: maxPage }, (_, index) => index + 1);
  const categoriesDynamic = useMemo(() => {
    const unique = Array.from(
      new Set(outOfStockItems.map((p) => p.category)),
    );

    return [
      {
        key: "all" as CategoryKey,
        label: `Todos ${outOfStockItems.length}`,
      },
      ...unique.map((cat) => ({
        key: cat as CategoryKey,
        label: String(cat),
      })),
    ];
  }, [outOfStockItems]);

  const LISTPAG: { value: number }[] = useMemo(
    () => [{ value: 12 }, { value: 24 }, { value: 48 }, { value: 100 }],
    [],
  );

  const categoryTotal = useMemo(() => {
    return new Set(outOfStockItems.map((p) => p.category)).size;
  }, [outOfStockItems]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProductService.findAll();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      await ProductService.remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir produto");
    } finally {
      setDeletingId(null);
    }
  };

  const categoriesForSelect = categoriesDynamic.map((c) => ({
    value: c.key,
    label: c.label,
  }));
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produtos sem estoque</h1>
          <p className={styles.subtitle}>
            Visualize produtos e variações com estoque zerado, ativos ou desativados.
          </p>
        </div>
      </div>

      <section className={styles.metrics}>
        <StatCard
          label="Total de itens"
          value={outOfStockItems.length}
          sub="Produtos e variações com estoque zerado"
          icon={<FiBox />}
          iconColor="#EFF6FF"
          iconBackgroundColor="#3B82F6"
          valueColor="#3B82F6"
        />
        <StatCard
          label="Atenção"
          value={"Reposição urgente"}
          sub="Todos os itens zerados"
          icon={<FiAlertTriangle />}
          iconColor="#FFFBEB"
          iconBackgroundColor="#F59E0B"
          valueColor="#F59E0B"
        />
        <StatCard
          label="Categorias"
          value={categoryTotal}
          sub="Categorias afetadas"
          icon={<FiGrid />}
        />
      </section>

      <div className={styles.gridContainer}>
        <div className={styles.filters}>
          <div className={styles.searchGroup}>
            <div className={styles.search}>
              <FiSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar produtos e variações sem estoque..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
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

          <div className={styles.filterActions}>
            <CustomSelect
              options={categoriesForSelect}
              value={activeCat}
              onChange={(value) => {
                setActiveCat(value as CategoryKey);
                setPage(1);
              }}
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
              <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={(newFilters) => {
                  setFilters(newFilters);
                  setActiveCat(newFilters.category);
                  setPage(1);
                }}
                categories={categoriesDynamic}
                initialFilters={filters}
              />
            </div>
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
            <h3 className={styles.emptyTitle}>Nenhum item sem estoque encontrado</h3>
            <p className={styles.emptySubtitle}>
              Nenhum produto ou variação com estoque zerado corresponde à busca e aos filtros atuais.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {paginated.map((p) => (
              <EntityCard
                lowStock={p.lowStock}
                key={`${p.productId}:${p.id}`}
                id={p.id}
                name={p.name}
                description={p.description}
                category={p.category}
                price={p.price}
                height={400}
                promoPrice={p.promoPrice}
                imageUrl={p.images || []}
                stock={p.stock ?? undefined}
                available
                color={p.color}
                size={p.size}
                status={p.status}
                onEdit={() => {}}
                onDelete={p.isVariation ? undefined : handleDelete}
                onToggleAvailable={() => {}}
                navigateTo={`/product-details/${p.productId}`}
              />
            ))}
          </div>
        )}

        <div className={styles.bottom}>
          <div className={styles.counter}>
            Mostrando {paginated.length} de {total} itens
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
      </div>
    </div>
  );
}
