import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./SupplierDetails.module.css";
import { SupplierService } from "../../service/Supplier.service";
import {
  ArrowUpRight,
  BadgeCheck,
  Barcode,
  Boxes,
  Building2,
  ExternalLink,
  ImageIcon,
  Layers3,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Save,
} from "lucide-react";
import { ButtonBack } from "../../components/ButtonBack/ButtonBack";
import { ImageGallery } from "../../components/ImageGallery/ImageGallery";
import type { ProductResponse } from "../../dtos/response/product-response.dto";
// import type { SupplierStatus } from "../../dtos/request/supplier-request.dto";

type SupplierDetailsView = "info" | "products";

function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "Sem preço";

  return toNumber(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getProductImage(product: ProductResponse) {
  return (
    product.images?.[0]?.url ??
    product.variations?.find((variation) => variation.imageUrl)?.imageUrl ??
    null
  );
}

function getProductStock(product: ProductResponse) {
  if (product.variations?.length) {
    return product.variations.reduce(
      (total, variation) => total + toNumber(variation.stock),
      0,
    );
  }

  return toNumber(product.stock);
}

function getProductPriceLabel(product: ProductResponse) {
  if (product.variations?.length) {
    const prices = product.variations
      .map((variation) => toNumber(variation.price))
      .filter((price) => price > 0);

    if (!prices.length) return "Sem preço";

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }

  return formatCurrency(product.promoPrice ?? product.price);
}

function getProductColors(product: ProductResponse) {
  const values = product.variations?.length
    ? product.variations.map((variation) => variation.color)
    : [product.color];

  return Array.from(new Set(values.filter(Boolean))).slice(0, 5) as string[];
}

function getProductBarcodeLabel(product: ProductResponse) {
  if (product.variations?.length) {
    const variationBarCodes = product.variations
      .map((variation) => variation.barCode)
      .filter(Boolean);

    return variationBarCodes.length
      ? variationBarCodes.join(", ")
      : "Sem código";
  }

  return product.barCode || "Sem código";
}

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getWhatsAppUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  const phoneWithCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${phoneWithCountry}`;
}

export function SupplierDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkSite, setLinkSite] = useState("");
  const CATEGORY_OPTIONS = [
    "Camisa",
    "Camiseta",
    "Pólo",
    "Shorts",
    "Jaqueta",
    "Calça",
    "Vestido",
    "Suéter",
    "Moletom",
    "Cueca",
    "Calçado",
    "Cinto",
    "Carteira",
    "Óculos",
  ];
  const STATUS_OPTIONS = [
    { value: "active", label: "Ativo" },
    { value: "inactive", label: "Desativado" },
  ];
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0].value);
  const [avatarColor, setAvatarColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activeView, setActiveView] = useState<SupplierDetailsView>("info");
  const [linkedProducts, setLinkedProducts] = useState<ProductResponse[]>([]);
  const onPickImages = () => {
    fileInputRef.current?.click();
  };

  const onImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setImageFiles((prev) => [...prev, ...files]);
    setImageNames((prev) => [...prev, ...files.map((file) => file.name)]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const onRemoveImage = (index: number) => {
    const existingCount = existingImageIds.length;

    if (index < existingCount) {
      setExistingImageIds((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingCount;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    setImageNames((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    if (selectedImageIndex >= imagePreviews.length - 1) {
      setSelectedImageIndex(Math.max(0, imagePreviews.length - 2));
    }
  };

  const onClearForm = () => {
    setName("");
    setCategory("");
    setEmail("");
    setPhone("");
    setLocation("");
    setLinkSite("");
    setStatus("active");
    setAvatarColor("");
    setImagePreviews([]);
    setExistingImageIds([]);
    setImageFiles([]);
    setSelectedImageIndex(0);
    setLinkedProducts([]);
    setActiveView("info");
  };

  useEffect(() => {
    const loadSupplier = async () => {
      if (!isEdit || !id) {
        onClearForm();
        return;
      }
      const data = await SupplierService.findOne(id);
      setName(String(data?.name ?? ""));
      setCategory(String(data?.category ?? ""));
      setEmail(String(data?.email ?? ""));
      setPhone(String(data?.phone ?? ""));
      setLocation(String(data?.location ?? ""));
      setLinkSite(String(data?.linkSite ?? ""));
      setStatus(String(data?.status ?? "active"));
      setAvatarColor(String(data?.avatarColor ?? ""));
      setImageNames([]);
      setImageFiles([]);
      setExistingImageIds([]);
      setSelectedImageIndex(0);
      setLinkedProducts(Array.isArray(data?.products) ? data.products : []);
      if (Array.isArray(data?.images) && data.images.length > 0) {
        setImagePreviews(data.images.map((img) => img.url));
        setImageNames(data.images.map((img) => img.url));
        setExistingImageIds(
          data.images
            .map((img) => img.id)
            .filter((imageId): imageId is string => Boolean(imageId)),
        );
      } else {
        setImagePreviews([]);
        setImageNames([]);
        setExistingImageIds([]);
      }
    };
    loadSupplier();
  }, [id, isEdit]);

  function onlyNumbers(value: string): string {
    return value.replace(/\D/g, "");
  }
  const onSave = async () => {
    if (saving) return;
    const formData = new FormData();
    const safeName = (name ?? "").toString().trim();
    formData.append("name", safeName);
    formData.append("category", String(category ?? ""));
    formData.append("email", String(email ?? ""));
    formData.append("phone", onlyNumbers(phone.trim() ?? ""));
    formData.append("location", String(location ?? ""));
    formData.append("linkSite", String(linkSite ?? ""));
    formData.append("status", String(status ?? ""));
    formData.append("avatarColor", String(avatarColor ?? ""));
    if (isEdit) {
      formData.append("imageIds", JSON.stringify(existingImageIds));
    }
    imageFiles.forEach((file) => {
      formData.append("image", file);
    });
    try {
      setSaving(true);
      if (isEdit && id) {
        await SupplierService.update(id, formData);
        navigate(-1);
        return;
      }
      await SupplierService.create(formData);
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = isEdit ? "Salvar alterações" : "Criar fornecedor";
  const loadingLabel = isEdit ? "Salvando..." : "Criando...";
  const linkedProductsCount = linkedProducts.length;
  const supplierSiteUrl = normalizeSiteUrl(linkSite);
  const supplierWhatsAppUrl = getWhatsAppUrl(phone);
  const totalLinkedStock = linkedProducts.reduce(
    (total, product) => total + getProductStock(product),
    0,
  );
  const totalLinkedVariations = linkedProducts.reduce(
    (total, product) => total + (product.variations?.length ?? 0),
    0,
  );
  const supplierInitials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "F";

  function phoneMask(value: string): string {
    if (!value) return "";

    // remove tudo que não for número
    value = value.replace(/\D/g, "");

    // limita a 11 dígitos
    value = value.slice(0, 11);

    if (value.length <= 10) {
      // telefone fixo: (99) 9999-9999
      return value
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // celular: (99) 99999-9999
      return value
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  }
  return (
    <div className={styles.page}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onImagesSelected}
      />

      <div className={styles.top}>
        <div className={styles.topIntro}>
          <ButtonBack />
          <div>
            <h1 className={styles.title}>
              {isEdit ? "Editar fornecedor" : "Cadastro de novo fornecedor"}
            </h1>
            <p className={styles.subtitle}>
              {isEdit
                ? "Atualize as informações principais do fornecedor."
                : "Preencha as informações principais do fornecedor."}
            </p>
          </div>
        </div>
        <div className={styles.topActions}>
          <button
            className={styles.discard}
            type="button"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button
            className={styles.save}
            type="button"
            onClick={onSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? loadingLabel : actionLabel}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className={styles.viewSwitcher} role="tablist">
          <button
            className={`${styles.viewTab} ${
              activeView === "info" ? styles.viewTabActive : ""
            }`}
            type="button"
            role="tab"
            aria-selected={activeView === "info"}
            onClick={() => setActiveView("info")}
          >
            <Building2 size={18} />
            <span>Fornecedor</span>
          </button>
          <button
            className={`${styles.viewTab} ${
              activeView === "products" ? styles.viewTabActive : ""
            }`}
            type="button"
            role="tab"
            aria-selected={activeView === "products"}
            onClick={() => setActiveView("products")}
          >
            <Package size={18} />
            <span>Produtos vinculados</span>
            <strong>{linkedProductsCount}</strong>
          </button>
        </div>
      )}

      {activeView === "info" ? (
        <div className={styles.content}>
          <aside className={styles.logoCard}>
            <div className={styles.logoTitle}>Logo do fornecedor</div>
            <ImageGallery
              label="Logo do fornecedor"
              previews={imagePreviews}
              selectedIndex={selectedImageIndex}
              imageNames={imageNames}
              onSelectImage={setSelectedImageIndex}
              onAddImages={onPickImages}
              onRemoveImage={onRemoveImage}
            />
            <p className={styles.logoTip}>
              Dica: use imagens com boa resolução para identificar a marca.
            </p>
          </aside>

          <div className={styles.formColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>1</span>
                <span className={styles.panelTitle}>
                  Informações da empresa
                </span>
              </div>

              <div className={styles.form}>
                <label className={styles.field}>
                  <span className={styles.label}>Nome</span>
                  <input
                    className={styles.input}
                    placeholder="Ex: Pinha Distribuidora"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>2</span>
                <span className={styles.panelTitle}>Contato e endereço</span>
              </div>

              <div className={styles.form}>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>E-mail</span>
                    <input
                      className={styles.input}
                      placeholder="contato@fornecedor.com.br"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Telefone/WhatsApp</span>
                    <input
                      className={styles.input}
                      placeholder="(00) 00000-0000"
                      value={phoneMask(phone)}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.label}>Localização</span>
                  <input
                    className={styles.input}
                    placeholder="Endereço completo"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Site do fornecedor</span>
                  <input
                    className={styles.input}
                    placeholder="exemplo.com.br"
                    value={linkSite}
                    onChange={(event) => setLinkSite(event.target.value)}
                  />
                </label>

                {(supplierSiteUrl || supplierWhatsAppUrl) && (
                  <div className={styles.contactActions}>
                    {supplierSiteUrl && (
                      <a
                        className={styles.siteAction}
                        href={supplierSiteUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={16} />
                        Entrar no site
                      </a>
                    )}
                    {supplierWhatsAppUrl && (
                      <a
                        className={styles.whatsappAction}
                        href={supplierWhatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={16} />
                        Falar no WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelNumber}>3</span>
                <span className={styles.panelTitle}>
                  Detalhes do fornecedor
                </span>
              </div>

              <div className={styles.form}>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Categoria</span>
                    <select
                      className={styles.select}
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Status</span>
                    <select
                      className={styles.select}
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Cor do Avatar</span>
                    <input
                      className={styles.input}
                      placeholder="#000000"
                      value={avatarColor}
                      onChange={(event) => setAvatarColor(event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className={styles.productsWorkspace}>
          <aside className={styles.supplierSummary}>
            <div
              className={styles.summaryAvatar}
              style={avatarColor ? { backgroundColor: avatarColor } : undefined}
            >
              {imagePreviews[0] ? (
                <img src={imagePreviews[0]} alt={name || "Fornecedor"} />
              ) : (
                supplierInitials
              )}
            </div>
            <div>
              <span className={styles.summaryEyebrow}>Fornecedor</span>
              <h2>{name || "Fornecedor sem nome"}</h2>
              <span
                className={`${styles.summaryStatus} ${
                  status === "active"
                    ? styles.summaryStatusActive
                    : styles.summaryStatusInactive
                }`}
              >
                <BadgeCheck size={14} />
                {status === "active" ? "Ativo" : "Desativado"}
              </span>
            </div>

            <div className={styles.summaryMeta}>
              <span title={email}>
                <Mail size={15} />
                {email || "E-mail não informado"}
              </span>
              <span title={phone}>
                <Phone size={15} />
                {phoneMask(phone) || "Telefone não informado"}
              </span>
              <span title={location}>
                <MapPin size={15} />
                {location || "Localização não informada"}
              </span>
              <span title={linkSite}>
                <ExternalLink size={15} />
                {linkSite || "Site não informado"}
              </span>
            </div>

            <div className={styles.summaryStats}>
              <div>
                <strong>{linkedProductsCount}</strong>
                <span>Produtos</span>
              </div>
              <div>
                <strong>{totalLinkedStock}</strong>
                <span>Em estoque</span>
              </div>
              <div>
                <strong>{totalLinkedVariations}</strong>
                <span>Variações</span>
              </div>
            </div>
          </aside>

          <section className={styles.productsPanel}>
            <div className={styles.productsHeader}>
              <div>
                <span className={styles.summaryEyebrow}>
                  Catálogo vinculado
                </span>
                <h2>Produtos deste fornecedor</h2>
                <p>Produtos que estão usando este fornecedor no cadastro.</p>
              </div>
              <span className={styles.productsCounter}>
                <Boxes size={16} />
                {linkedProductsCount} produto
                {linkedProductsCount === 1 ? "" : "s"}
              </span>
            </div>

            {linkedProducts.length === 0 ? (
              <div className={styles.emptyProducts}>
                <Package size={34} />
                <strong>Nenhum produto vinculado</strong>
                <span>
                  Quando um produto for associado a este fornecedor, ele
                  aparecerá aqui.
                </span>
              </div>
            ) : (
              <div className={styles.linkedProductsGrid}>
                {linkedProducts.map((product) => {
                  const imageUrl = getProductImage(product);
                  const stock = getProductStock(product);
                  const colors = getProductColors(product);
                  const variationsCount = product.variations?.length ?? 0;
                  const isActive = String(product.status) === "ACTIVED";

                  return (
                    <article
                      className={styles.linkedProductCard}
                      key={product.id}
                      onClick={() => navigate(`/product-details/${product.id}`)}
                    >
                      <div className={styles.linkedProductMedia}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} />
                        ) : (
                          <ImageIcon size={28} />
                        )}
                      </div>
                      <div className={styles.linkedProductBody}>
                        <div className={styles.linkedProductTop}>
                          <span>{product.category || "Sem categoria"}</span>
                          <strong
                            className={
                              isActive
                                ? styles.productStatusActive
                                : styles.productStatusInactive
                            }
                          >
                            {isActive ? "Ativo" : "Inativo"}
                          </strong>
                        </div>
                        <h3 title={product.name}>{product.name}</h3>

                        <div className={styles.productFacts}>
                          <span>
                            <Barcode size={14} />
                            {getProductBarcodeLabel(product)}
                          </span>
                          <span>
                            <Package size={14} />
                            Estoque {stock}
                          </span>
                          <span>
                            <Layers3 size={14} />
                            {variationsCount > 0
                              ? `${variationsCount} variação${
                                  variationsCount === 1 ? "" : "es"
                                }`
                              : product.size || "Produto único"}
                          </span>
                        </div>

                        <div className={styles.linkedProductFooter}>
                          <strong>{getProductPriceLabel(product)}</strong>
                          <div className={styles.colorStack}>
                            {colors.map((color) => (
                              <span
                                key={color}
                                title={color}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        className={styles.openProductButton}
                        type="button"
                        aria-label="Abrir produto"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
