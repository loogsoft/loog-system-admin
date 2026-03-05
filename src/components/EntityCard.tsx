import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./EntityCard.module.css";
import {
  FiBox,
  FiDollarSign,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
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
  onToggleAvailable?: (id: string) => void;
  navigateTo: string;
  status: ProductStatusEnum | undefined;
  actionButton?: React.ReactNode;
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
      onClick={() => props.navigateTo ? navigate(props.navigateTo) : undefined}
    >
      <div className={`${styles.media} ${styles.productMedia}`}>
        {props.isActiveStock && props.stock !== undefined && props.stock > 0 && props.stock <= props.lowStock ? (
          <div className={styles.lowStock}>ESTOQUE BAIXO</div>
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
                        index === currentImageIndex ? styles.imageIndicatorActive : ""
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
          { props.description && props.description.length > 110 ? props.description.slice(0,110) + "..." : props.description }
        </div>

        <div className={styles.productMeta}>
          {props.promoPrice && Number(props.promoPrice) > 0 ? (
            <>
              <div className={styles.metaItem}>
                <FiDollarSign className={styles.metaIcon} />
                <span className={styles.originalPrice}>{currencyBRL(Number(props.price))}</span>
              </div>
              <div className={`${styles.metaItem} ${styles.promoItem}`}>
                <FiDollarSign className={styles.metaIcon} />
                <span className={styles.promoPrice}>{currencyBRL(Number(props.promoPrice))}</span>
                <span className={styles.discount}>
                  -{Math.round(((Number(props.price) - Number(props.promoPrice)) / Number(props.price)) * 100)}%
                </span>
              </div>
            </>
          ) : (
            <div className={styles.metaItem}>
              <FiDollarSign className={styles.metaIcon} />
              {currencyBRL(Number(props.price))}
            </div>
          )}
          
          {props.isActiveStock && props.stock !== undefined && props.stock > 0 && (
            <div className={styles.metaItem}>
              <FiBox className={styles.metaIcon} />
              {`Estoque: ${props.stock}`}
            </div>
          )}

          {props.isActiveStock && props.lowStock > 0 && (
            <div className={styles.metaItem}>
              <FiBox className={styles.metaIcon} />
              {`Alerta de estoque: ${props.lowStock}`}
            </div>
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
