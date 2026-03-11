import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./EntityCard.module.css";
import {
  FiBox,
  FiLayers,
  FiDollarSign,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { GiTrousers, GiTShirt } from "react-icons/gi";
import type { CSSProperties } from "react";
import type { ProductCategoryEnum } from "../dtos/enums/product-category.enum";
import type { ImageResponse } from "../dtos/response/image-response.dto";
import { ProductStatusEnum } from "../dtos/enums/product-status.enum";
import { ArrowUpRight } from "lucide-react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

type BaseProps = {
  id: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

type ProductProps = BaseProps & {
  type?: "product";
  name: string;
  description: string | undefined;
  category: ProductCategoryEnum;
  price: number | string;
  promoPrice?: number | string;
  imageUrl: ImageResponse[];
  stock: number | undefined;
  lowStock: number;
  isActiveStock: boolean;
  available: boolean;
  color?: string;
  colors?: string[];
  size?: string;
  sizes?: string[];
  onToggleAvailable?: (id: string) => void;
  navigateTo: string;
  status: ProductStatusEnum | undefined;
  actionButton?: React.ReactNode;
  variations?: any[];
};

type SupplierProps = BaseProps & {
  type: "supplier";
  name: string;
  category: string;
  email: string;
  phone: string;
  location: string;
  isActive: boolean;
  initials: string;
  avatarColor?: string;
};

type Props = ProductProps | SupplierProps;

function currencyBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getProductIcon = (value: string) => {
  const normalized = normalizeText(value);
  if (normalized.includes("camiseta") || normalized.includes("camisa")) {
    return <GiTShirt />;
  }
  if (normalized.includes("calca") || normalized.includes("pants")) {
    return <GiTrousers />;
  }
  return <FiPackage />;
};

export default function EntityCard(props: Props) {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const statusValue =
    props.type === "supplier" ? ProductStatusEnum.ACTIVED : props.status;

  if (props.type === "supplier") {
    const supplierAvatarStyle = props.avatarColor
      ? ({ backgroundColor: props.avatarColor } as CSSProperties)
      : undefined;
    const statusLabel = props.isActive ? "ATIVO" : "INATIVO";
    return (
      <div
        className={`${styles.card} ${styles.supplierCard}`}
        onClick={() => props.onEdit?.(props.id)}
      >
        <div className={`${styles.media} ${styles.supplierMedia}`}>
          <div
            className={`${styles.avatar} ${styles.supplierAvatar}`}
            style={supplierAvatarStyle}
          >
            <span className={styles.avatarText}>{props.initials}</span>
          </div>

          <div className={styles.cardActions}>
            <button
              className={styles.iconBtn}
              type="button"
              aria-label="Excluir"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        <div className={`${styles.body} ${styles.supplierBody}`}>
          <div className={styles.nameRow}>
            <div className={styles.name}>{props.name}</div>
            <div
              className={`${styles.statusBadge} ${
                props.isActive ? styles.statusActive : styles.statusInactive
              }`}
            >
              {statusLabel}
            </div>
          </div>
          <div className={`${styles.category} ${styles.supplierCategory}`}>
            {props.category}
          </div>

          <div className={styles.supplierMeta}>
            <div className={styles.metaItem}>
              <FiMail className={styles.metaIcon} />
              {props.email}
            </div>
            <div className={styles.metaItem}>
              <FiPhone className={styles.metaIcon} />
              {props.phone}
            </div>
            <div className={styles.metaItem}>
              <FiMapPin className={styles.metaIcon} />
              {props.location}
            </div>
          </div>
        </div>

        <button
          className={styles.iconBtnEdit}
          type="button"
          aria-label="Editar"
          onClick={(e) => {
            e.stopPropagation();
            props.onEdit?.(props.id);
          }}
        >
          <ArrowUpRight />
        </button>

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => props.onDelete?.(props.id)}
          title="Remover fornecedor"
          message="Tem certeza que deseja remover este fornecedor?"
          itemName={props.name}
        />
      </div>
    );
  }

  const statusLabel =
    statusValue === ProductStatusEnum.ACTIVED ? "ATIVO" : "INATIVO";
  const productIcon = getProductIcon(`${props.name} ${props.category}`);

  const images = props.imageUrl || [];
  const hasMultipleImages = images.length > 1;
  const productImageUrl = images[currentImageIndex]?.url || "";


  // Sempre tratar como detalhado: se não houver variations, cria uma variação "fake" com os dados principais
  let variations: any[] = [];
  if (Array.isArray((props as any).variations) && (props as any).variations.length > 0) {
    variations = (props as any).variations;
  }
  const [showVariations, setShowVariations] = useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  return (
    <div
      className={`${styles.card} ${styles.EntityCard}`}
      onClick={() =>
        props.navigateTo ? navigate(props.navigateTo) : undefined
      }
    >
      <div className={`${styles.media} ${styles.productMedia}`}>
        {props.isActiveStock &&
        props.stock !== undefined &&
        props.stock > 0 &&
        props.stock <= props.lowStock ? (
          <div className={styles.lowStock}>ESTOQUE BAIXO</div>
        ) : null}
        {props.isActiveStock && (props.stock ?? 0) === 0 ? (
          <div className={styles.zeroStockOverlay}>
            <span className={styles.zeroStockOverlayLabel}>Esgotado</span>
          </div>
        ) : null}
        {productImageUrl ? (
          <>
            <img
              className={styles.image}
              src={productImageUrl}
              alt={props.name}
              loading="lazy"
            />
            {hasMultipleImages && (
              <>
                <button
                  className={styles.imageNavBtn + " " + styles.imageNavBtnLeft}
                  type="button"
                  aria-label="Imagem anterior"
                  onClick={handlePrevImage}
                >
                  <FiChevronLeft />
                </button>
                <button
                  className={styles.imageNavBtn + " " + styles.imageNavBtnRight}
                  type="button"
                  aria-label="Próxima imagem"
                  onClick={handleNextImage}
                >
                  <FiChevronRight />
                </button>
                <div className={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`${styles.imageIndicator} ${
                        index === currentImageIndex
                          ? styles.imageIndicatorActive
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={`${styles.avatar} ${styles.productAvatar}`}>
            <span className={styles.productIcon}>{productIcon}</span>
          </div>
        )}
        {props.onDelete ? (
          <div className={styles.cardActions}>
            <button
              className={styles.iconBtn}
              type="button"
              aria-label="Excluir"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
            >
              <FiTrash2 />
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <div className={styles.name}>{props.name}</div>
          <div
            className={`${styles.statusBadge} ${
              statusValue === ProductStatusEnum.ACTIVED
                ? styles.statusActive
                : styles.statusInactive
            }`}
          >
            {statusLabel}
          </div>
        </div>
        <div className={`${styles.category} ${styles.productCategory}`}>
          {props.description && props.description.length > 30
            ? props.description.slice(0, 30) + "..."
            : props.description}
        </div>

        <div className={styles.productMeta}>
          {props.promoPrice && Number(props.promoPrice) > 0 ? (
            <>
              <div className={styles.metaItem}>
                <FiDollarSign className={styles.metaIcon} />
                <span className={styles.originalPrice}>
                  {currencyBRL(Number(props.price))}
                </span>
              </div>
              <div className={`${styles.metaItem} ${styles.promoItem}`}>
                <FiDollarSign className={styles.metaIcon} />
                <span className={styles.promoPrice}>
                  {currencyBRL(Number(props.promoPrice))}
                </span>
                <span className={styles.discount}>
                  -
                  {Math.round(
                    ((Number(props.price) - Number(props.promoPrice)) /
                      Number(props.price)) *
                      100,
                  )}
                  %
                </span>
              </div>
            </>
          ) : (
            <div className={styles.metaItem}>
              <FiDollarSign className={styles.metaIcon} />
              {currencyBRL(Number(props.price))}
            </div>
          )}
          {props.isActiveStock && props.lowStock > 0 && (
            <div className={styles.metaItem}>
              <FiBox className={styles.metaIcon} />
              {`Alerta de estoque: ${props.lowStock}`}
            </div>
          )}

          {variations.length > 0 ? (
            <div className={styles.variationBlock}>
              <button
                type="button"
                className={styles.variationToggle}
                tabIndex={-1}
                onClick={e => {
                  e.stopPropagation();
                  setShowVariations((v) => !v);
                }}
                aria-expanded={showVariations}
                aria-controls="variation-list"
              >
                <FiLayers className={styles.variationToggleIcon} />
                <span className={styles.variationToggleLabel}>Variações</span>
                <FiChevronDown className={styles.variationChevron} style={{ transform: showVariations ? "rotate(180deg)" : undefined }} />
              </button>
              {showVariations && (
                <div className={styles.variationList} id="variation-list">
                  {variations.map((v: any, i: number) => (
                    <div className={styles.variationCard} key={v.id || i}>
                      <div className={styles.variationCardRow}>
                        <span className={styles.variationLabel}>
                          Tamanho: {" "}
                          <span className={styles.variationValue}>
                            {v.size || "-"}
                          </span>
                        </span>
                        <span className={styles.variationColors}>
                          {(v.colors && Array.isArray(v.colors) && v.colors.length > 0
                            ? v.colors
                            : v.color
                              ? [v.color]
                              : []
                          ).map((color: string, idx: number) => (
                            <span
                              key={idx}
                              className={styles.variationColorDot}
                              style={{ background: color || "#ccc" }}
                              title={color || ""}
                            />
                          ))}
                        </span>
                      </div>
                      <div className={styles.variationCardRow}>
                        <span className={styles.variationStock}>
                          Estoque: {" "}
                          <span className={styles.variationValue}>
                            {v.stock ?? 0}
                          </span>
                        </span>
                        {v.price && Number(v.price) !== Number(props.price) && (
                          <span className={styles.variationPrice}>
                            {currencyBRL(Number(v.price))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.metaItem}>
                <FiLayers className={styles.metaIcon} />
                {`Tamanho: ${props.size || "-"}`}
              </div>
              {((props.colors && props.colors.length > 0) || props.color) && (
                <div className={styles.metaItem}>
                  <FiBox className={styles.metaIcon} />
                  <span>Cor:</span>
                  <span className={styles.variationColors}>
                    {(props.colors && props.colors.length > 0
                      ? props.colors
                      : props.color
                        ? [props.color]
                        : []
                    ).map((c: string, idx: number) => (
                      <span
                        key={idx}
                        className={styles.variationColorDot}
                        style={{ background: c || "#ccc" }}
                        title={c || ""}
                      />
                    ))}
                  </span>
                </div>
              )}
              {props.isActiveStock && props.stock !== undefined && (
                <div className={styles.metaItem}>
                  <FiPackage className={styles.metaIcon} />
                  {`Estoque: ${props.stock}`}
                </div>
              )}
              {props.isActiveStock && (props.stock ?? 0) === 0 && (
                <div className={styles.zeroStockBadge}>⚠ Produto esgotado</div>
              )}
            </>
          )}
        </div>

        {!statusValue ? (
          <div className={styles.outOfStock}>SEM ESTOQUE</div>
        ) : null}

        {props.actionButton ? (
          <div className={styles.actionButtonWrapper}>{props.actionButton}</div>
        ) : null}
      </div>
      {props.navigateTo ? (
        <button
          className={styles.iconBtnEdit}
          type="button"
          aria-label="Editar"
          onClick={(e) => {
            e.stopPropagation();
            navigate(props.navigateTo);
          }}
        >
          <ArrowUpRight />
        </button>
      ) : null}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => props.onDelete?.(props.id)}
        title="Remover produto"
        message="Tem certeza que deseja remover este produto?"
        itemName={props.name}
      />
    </div>
  );
}
