import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./CreditDetails.module.css";
import { ProductCategoryEnum } from "../../dtos/enums/product-category.enum";
import { ProductStatusEnum } from "../../dtos/enums/product-status.enum";
import { ProductService } from "../../service/Product.service";
import type { ProductRequest } from "../../dtos/request/product-request.dto";
import type { ProductVariationRequestDto } from "../../dtos/request/product-variation-request.dto";
import type { ProductVariationResponseDto } from "../../dtos/response/product-variation-response.dto";
import { Save, Plus, Pencil } from "lucide-react";
import { ImageGallery } from "../../components/ImageGallery";
import EntityCard from "../../components/EntityCard";
import { ButtonBack } from "../../components/ButtonBack/ButtonBack";
import { FiTrash2 } from "react-icons/fi";

type Variation = ProductVariationRequestDto | ProductVariationResponseDto;

const PRODUCT_COLORS = [
  { label: "Preto", hex: "#1A1A1A" },
  { label: "Branco", hex: "#FFFFFF" },
  { label: "Cinza", hex: "#9E9E9E" },
  { label: "Azul", hex: "#1565C0" },
  { label: "Vermelho", hex: "#C62828" },
];

const ProductType = {
  UNIQUE: "UNIQUE",
  VARIATION: "VARIATION",
} as const;

export function CreditDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const variationFileInputRef = useRef<HTMLInputElement | null>(null);
  const colorPickerRef = useRef<HTMLInputElement | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColor, setEditingColor] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [productType, setProductType] = useState<
    (typeof ProductType)[keyof typeof ProductType]
  >(ProductType.UNIQUE);
  const [category, setCategory] = useState<ProductCategoryEnum>(
    ProductCategoryEnum.SHIRT,
  );
  const [status, setStatus] = useState<ProductStatusEnum>(
    ProductStatusEnum.ACTIVED,
  );
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [lowStock, setLowStock] = useState("5");
  const [lowStockAlertEnabled, setLowStockAlertEnabled] = useState(true);
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stock, setStock] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [expandedVariationForm, setExpandedVariationForm] = useState(false);
  const [variationPrice, setVariationPrice] = useState("");
  const [variationStock, setVariationStock] = useState("");
  const [variationColor, setVariationColor] = useState("");
  const [showVariationColorPicker, setShowVariationColorPicker] =
    useState(false);
  const [variationSize, setVariationSize] = useState("");
  const [variationIsActive, setVariationIsActive] = useState(true);
  const [variationLowStockAlertEnabled, setVariationLowStockAlertEnabled] = useState(false);
  const [variationLowStock, setVariationLowStock] = useState("");
  const [variationImageFiles, setVariationImageFiles] = useState<File[]>([]);
  const [variationImagePreviews, setVariationImagePreviews] = useState<
    string[]
  >([]);
  const [selectedVariationImageIndex, setSelectedVariationImageIndex] =
    useState(0);
  const [editingVariationIndex, setEditingVariationIndex] = useState<
    number | null
  >(null);
  const categoryOptions = useMemo(() => Object.values(ProductCategoryEnum), []);
  const statusOptions = useMemo(() => Object.values(ProductStatusEnum), []);

  const getStatusLabel = (status: ProductStatusEnum) => {
    switch (status) {
      case ProductStatusEnum.ACTIVED:
        return "Ativo";
      case ProductStatusEnum.DISABLED:
        return "Desativado";
      default:
        return status;
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!isEdit || !id) {
        return;
      }

      const data = await ProductService.findOne(id);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setCategory(data.category ?? ProductCategoryEnum.SHIRT);
      setStatus(data.status ?? ProductStatusEnum.ACTIVED);
      setPrice(data.price ? String(data.price).replace(".", ",") : "");
      setPromoPrice(
        data.promoPrice ? String(data.promoPrice).replace(".", ",") : "",
      );
      setColor(data.color ?? "");
      setSize(data.size ?? "");
      setLowStock(String(data.lowStock ?? ""));
      setLowStockAlertEnabled(!!data.lowStock && data.lowStock > 0);

      setStock(String(data.stock ?? ""));
      setImageNames((data.images || []).map((img) => img.fileName));
      setImageFiles([]);
      setImagePreviews((data.images || []).map((img) => img.url));
      setExistingImageIds((data.images || []).map((img) => img.id));
      setSelectedImageIndex(0);
      const hasVariations = (data.variations || []).length > 0;
      setProductType(
        hasVariations ? ProductType.VARIATION : ProductType.UNIQUE,
      );
      // Load variations but clean them to remove response-only fields
      const cleanLoadedVariations = (data.variations || []).map((v) => ({
        name: v.name,
        price: v.price,
        stock: v.stock,
        isActive: v.isActive ?? true,
        color: v.color,
        size: v.size,
        images: v.imageUrl
          ? [
              {
                url: v.imageUrl,
                fileName: v.name || "",
                id: "",
                isPrimary: false,
              },
            ]
          : undefined,
      })) as ProductVariationRequestDto[];
      setVariations(cleanLoadedVariations);
    };

    loadProduct();
  }, [id, isEdit]);

  const onPickImages = () => {
    fileInputRef.current?.click();
  };

  const onImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setImageNames((prev) => [...prev, ...files.map((file) => file.name)]);
    setImageFiles((prev) => [...prev, ...files]);

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

  const onOpenVariationForm = () => {
    setVariationPrice("");
    setVariationStock("");
    setVariationColor("");
    setVariationSize("");
    setVariationIsActive(true);
    setVariationImageFiles([]);
    setVariationImagePreviews([]);
    setSelectedVariationImageIndex(0);
    setShowVariationColorPicker(false);
    setEditingVariationIndex(null);
    setVariationLowStockAlertEnabled(false);
    setVariationLowStock("");
    setExpandedVariationForm(true);
  };

  const onCloseVariationForm = () => {
    setExpandedVariationForm(false);
    setVariationImageFiles([]);
    setVariationImagePreviews([]);
    setSelectedVariationImageIndex(0);
    setShowVariationColorPicker(false);
    setEditingVariationIndex(null);
  };

  const onEditVariation = (index: number) => {
    const v = variations[index];
    setVariationColor(v.color || "");
    setVariationSize(v.size || "");
    setVariationPrice(v.price ? String(v.price).replace(".", ",") : "");
    setVariationStock(
      v.stock !== undefined && v.stock !== null ? String(v.stock) : "",
    );
    setVariationIsActive(v.isActive ?? true);
    setVariationLowStockAlertEnabled('lowStock' in v && !!(v as any).lowStock && (v as any).lowStock > 0);
    setVariationLowStock('lowStock' in v && (v as any).lowStock !== undefined && (v as any).lowStock !== null ? String((v as any).lowStock) : "");
    const imgs = (v.images || []) as any[];
    setVariationImageFiles([]);
    setVariationImagePreviews(
      imgs.map((img) =>
        img instanceof File ? URL.createObjectURL(img) : img.url || "",
      ),
    );
    setSelectedVariationImageIndex(0);
    setShowVariationColorPicker(false);
    setEditingVariationIndex(index);
    setExpandedVariationForm(true);
  };

  const onPickVariationImages = () => {
    variationFileInputRef.current?.click();
  };

  const onVariationImagesSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setVariationImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setVariationImagePreviews((prev) => [
          ...prev,
          e.target?.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const onRemoveVariationImage = (index: number) => {
    setVariationImageFiles((prev) => prev.filter((_, i) => i !== index));
    setVariationImagePreviews((prev) => prev.filter((_, i) => i !== index));

    if (selectedVariationImageIndex >= variationImagePreviews.length - 1) {
      setSelectedVariationImageIndex(
        Math.max(0, variationImagePreviews.length - 2),
      );
    }
  };

  const onAddVariation = () => {
    if (!variationColor.trim() || !variationSize.trim()) {
      alert("Cor e tamanho da variação são obrigatórios");
      return;
    }

    if (!variationStock.trim()) {
      alert("Estoque da variação é obrigatório");
      return;
    }

    const duplicate = variations.some(
      (v, i) =>
        v.color === variationColor.trim() &&
        v.size === variationSize.trim() &&
        i !== editingVariationIndex,
    );

    if (duplicate) {
      alert(
        `Já existe uma variação com a cor ${variationColor} e tamanho ${variationSize}. Escolha uma combinação diferente.`,
      );
      return;
    }

    const targetIndex = editingVariationIndex;

    const existingImages =
      targetIndex !== null ? variations[targetIndex].images : undefined;

    const newVariation: ProductVariationRequestDto = {
      name: `${variationColor.trim()} ${variationSize.trim()}`,
      price: typeof variationPrice === "string" ? (variationPrice.trim() ? Number(toDot(variationPrice)) : undefined) : variationPrice,
      stock: Number(variationStock),
      color: variationColor.trim(),
      size: variationSize.trim(),
      isActive: variationIsActive,
      lowStock: variationLowStockAlertEnabled ? Number(variationLowStock || "0") : 0,
      images:
        variationImageFiles.length > 0
          ? variationImageFiles
          : (existingImages as any),
      activeLowStock: variationLowStockAlertEnabled,
    };

    if (targetIndex !== null) {
      setVariations((prev) => {
        const updated = [...prev];
        updated[targetIndex] = newVariation;
        return updated;
      });
    } else {
      setVariations((prev) => [...prev, newVariation]);
    }

    onCloseVariationForm();
  };

  const onRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const toDot = (value: string) =>
    value.replace(/\./g, "").replace(",", ".").trim();

  const onSave = async () => {
    if (saving) return;

    // Validações básicas
    if (!name.trim()) {
      alert("Nome do produto é obrigatório");
      return;
    }

    if (productType === ProductType.UNIQUE) {
      if (!price.trim()) {
        alert("Preço do produto é obrigatório");
        return;
      }
      if (!color.trim()) {
        alert("Cor do produto é obrigatória");
        return;
      }
      if (stockEnabled && !stock.trim()) {
        alert(
          "Quantidade em estoque é obrigatória quando controle de estoque está ativo",
        );
        return;
      }
    }

    // Clean variations: keep ONLY fields expected by backend
    // Remove: id, createdAt, updatedAt, createdBy, updatedBy, etc
    const cleanVariations =
      variations.length > 0
        ? variations.map((variation) => {
            let priceValue: number | undefined = undefined;
            if (typeof variation.price === "string") {
              priceValue = (variation.price as string).trim()
                ? Number(toDot(variation.price as string))
                : undefined;
            } else if (typeof variation.price === "number") {
              priceValue = variation.price;
            } else {
              priceValue = undefined;
            }

            return {
              name: variation.name,
              price: priceValue,
              stock: Number(variation.stock) || 0,
              isActive: variation.isActive ?? true,
              color: variation.color,
              size: variation.size,
              images: variation.images,
            };
          })
        : undefined;

    const payload: ProductRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      status,
      price: Number(toDot(price)),
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      promoPrice: promoPrice.trim() ? Number(toDot(promoPrice)) : undefined,
      lowStock: lowStockAlertEnabled ? Number(lowStock || "0") : 0,

      stock: stockEnabled ? Number(stock || 0) : 0,
      variations: cleanVariations,
      imageIds: isEdit ? existingImageIds : undefined,
      supplierId: supplierId.trim() || undefined,
    } as ProductRequest;

    try {
      setSaving(true);
      if (isEdit && id) {
        await ProductService.update(
          id,
          payload,
          imageFiles.length > 0 ? imageFiles : undefined,
        );
        navigate(-1);
        return;
      }
      await ProductService.create(payload, imageFiles);
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = isEdit ? "Salvar alterações" : "Criar produto";
  const loadingLabel = isEdit ? "Salvando..." : "Criando...";

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
      <input
        ref={variationFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onVariationImagesSelected}
      />

      <div className={styles.top}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <ButtonBack />
          <div>
            <h1 className={styles.title}>
              {isEdit ? "Editar produto" : "Cadastro de novo produto"}
            </h1>
            <p className={styles.subtitle}>
              {isEdit
                ? "Atualize as informações principais do produto."
                : "Preencha as informações principais do produto."}
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

      <div className={styles.content}>
        <aside className={styles.imageGalleryAside}>
          <ImageGallery
            previews={imagePreviews}
            selectedIndex={selectedImageIndex}
            imageNames={imageNames}
            onSelectImage={setSelectedImageIndex}
            onAddImages={onPickImages}
            onRemoveImage={onRemoveImage}
          />
        </aside>

        <div className={styles.formColumn} style={{ marginBottom: 40 }}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Informações do produto</span>
            </div>

            <div className={styles.form}>
              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Tipo de produto</span>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        background: "#F6F6F6",
                        borderRadius: 24,
                        overflow: "hidden",
                        padding: 3,
                        border: "1px solid #E0E0E0",
                        width: 320,
                        height: 40,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          background:
                            productType === ProductType.UNIQUE
                              ? "var(--highlight-primary)"
                              : "#F6F6F6",
                          color:
                            productType === ProductType.UNIQUE
                              ? "#ffffff"
                              : "#A0A0A0",
                          border: "none",
                          outline: "none",
                          fontWeight: 600,
                          fontSize: 13,
                          padding: "0 0.5rem",
                          borderRadius: 24,
                          boxShadow:
                            productType === ProductType.UNIQUE
                              ? "0 2px 8px #0001"
                              : "none",
                          transition: "all 0.2s",
                          cursor:
                            productType === ProductType.UNIQUE
                              ? "default"
                              : "pointer",
                        }}
                        onClick={() => setProductType(ProductType.UNIQUE)}
                        disabled={productType === ProductType.UNIQUE}
                      >
                        Produto único
                      </button>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          background:
                            productType === ProductType.VARIATION
                              ? "var(--highlight-primary)"
                              : "#F6F6F6",
                          color:
                            productType === ProductType.VARIATION
                              ? "#ffffff"
                              : "#A0A0A0",
                          border: "none",
                          outline: "none",
                          fontWeight: 600,
                          fontSize: 13,
                          padding: "0 0.5rem",
                          borderRadius: 24,
                          boxShadow:
                            productType === ProductType.VARIATION
                              ? "0 2px 8px #0001"
                              : "none",
                          transition: "all 0.2s",
                          cursor:
                            productType === ProductType.VARIATION
                              ? "default"
                              : "pointer",
                        }}
                        onClick={() => setProductType(ProductType.VARIATION)}
                        disabled={productType === ProductType.VARIATION}
                      >
                        Produto com variação
                      </button>
                    </div>
                  </div>
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Nome</span>
                <input
                  className={styles.input}
                  placeholder="Ex: Camisa social"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Descrição</span>
                <textarea
                  className={styles.textarea}
                  placeholder="Descreva o produto"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Categoria</span>
                  <select
                    className={styles.select}
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as ProductCategoryEnum)
                    }
                  >
                    {categoryOptions.map((option) => (
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
                    onChange={(event) =>
                      setStatus(event.target.value as ProductStatusEnum)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {getStatusLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>ID do fornecedor</span>
                <input
                  className={styles.input}
                  placeholder="Informe o ID do fornecedor"
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                />
              </label>

              {productType === ProductType.UNIQUE && (
                <>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <span className={styles.label}>Cor</span>
                      {isEdit && !editingColor ? (
                        <div className={styles.colorSwatches}>
                          {color && (
                            <span
                              className={`${styles.colorSwatch} ${styles.colorSwatchActive}`}
                              style={{ background: color }}
                            />
                          )}
                          {color && (
                            <span className={styles.colorHexLabel}>
                              {color}
                            </span>
                          )}
                          <button
                            type="button"
                            className={styles.changeColorBtn}
                            onClick={() => setEditingColor(true)}
                          >
                            {color ? "Alterar cor" : "Selecionar cor"}
                          </button>
                        </div>
                      ) : (
                        <div className={styles.colorSwatches}>
                          {PRODUCT_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.label}
                              className={`${styles.colorSwatch} ${
                                color === c.hex ? styles.colorSwatchActive : ""
                              }`}
                              style={{ background: c.hex }}
                              onClick={() =>
                                setColor(color === c.hex ? "" : c.hex)
                              }
                            />
                          ))}
                          <div className={styles.colorPickerWrapper}>
                            <button
                              type="button"
                              title="Cor personalizada"
                              className={`${styles.colorSwatch} ${styles.colorSwatchCustom} ${
                                color &&
                                !PRODUCT_COLORS.some((c) => c.hex === color)
                                  ? styles.colorSwatchActive
                                  : ""
                              }`}
                              style={{
                                background:
                                  color &&
                                  !PRODUCT_COLORS.some((c) => c.hex === color)
                                    ? color
                                    : undefined,
                              }}
                              onClick={() => setShowColorPicker((v) => !v)}
                            >
                              {!(
                                color &&
                                !PRODUCT_COLORS.some((c) => c.hex === color)
                              ) && (
                                <span className={styles.colorSwatchCustomIcon}>
                                  +
                                </span>
                              )}
                            </button>
                            {showColorPicker && (
                              <div className={styles.colorPickerPopover}>
                                <input
                                  ref={colorPickerRef}
                                  type="color"
                                  className={styles.colorPickerNative}
                                  value={color || "#000000"}
                                  onChange={(e) => setColor(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className={styles.colorPickerConfirm}
                                  onClick={() => setShowColorPicker(false)}
                                >
                                  OK
                                </button>
                              </div>
                            )}
                          </div>
                          {color && (
                            <span className={styles.colorHexLabel}>
                              {color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <label className={styles.field}>
                      <span className={styles.label}>Tamanho</span>
                      <input
                        className={styles.input}
                        placeholder="Ex: M, G, 42"
                        value={size}
                        onChange={(event) => setSize(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className={styles.row2}>
                    <label className={styles.field}>
                      <span className={styles.label}>Preço</span>
                      <input
                        className={styles.input}
                        placeholder="0,00"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Preço promocional</span>
                      <input
                        className={styles.input}
                        placeholder="0,00"
                        value={promoPrice}
                        onChange={(event) => setPromoPrice(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className={styles.field}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.label}>Controle de estoque</span>
                      <button
                        type="button"
                        className={`${styles.toggleSwitch} ${
                          stockEnabled ? styles.toggleSwitchActive : ""
                        }`}
                        onClick={() => setStockEnabled(!stockEnabled)}
                      >
                        <span className={styles.toggleSlider} />
                      </button>
                    </div>
                  </div>

                  {stockEnabled && (
                    <div className={styles.row2}>
                      <label className={styles.field}>
                        <span className={styles.label}>Quantidade</span>
                        <input
                          className={styles.input}
                          placeholder="0"
                          value={stock}
                          onChange={(event) => setStock(event.target.value)}
                        />
                      </label>

                      <div className={styles.field}>
                        <div className={styles.fieldHeader}>
                          <span className={styles.label}>
                            Estoque baixo (alerta)
                          </span>
                          <button
                            type="button"
                            className={`${styles.toggleSwitch} ${
                              lowStockAlertEnabled
                                ? styles.toggleSwitchActive
                                : ""
                            }`}
                            onClick={() =>
                              setLowStockAlertEnabled(!lowStockAlertEnabled)
                            }
                          >
                            <span className={styles.toggleSlider} />
                          </button>
                        </div>
                        {lowStockAlertEnabled && (
                          <input
                            className={styles.input}
                            placeholder="0"
                            value={lowStock}
                            onChange={(event) =>
                              setLowStock(event.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </section>

          {productType === ProductType.VARIATION && (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Variações do produto</span>
              </div>

              <div className={styles.form}>
                <button
                  type="button"
                  className={styles.addVariationBtn}
                  onClick={onOpenVariationForm}
                >
                  <Plus size={18} />
                  Adicionar variação
                </button>

                {expandedVariationForm && (
                  <div className={styles.variationFormCard}>
                    <div className={styles.variationFormHeader}>
                      <h3 className={styles.variationFormTitle}>
                        {editingVariationIndex !== null
                          ? "Editar variação"
                          : "Nova variação"}
                      </h3>
                    </div>

                    <div className={styles.variationFormBody}>
                      <div className={styles.variationCardContent}>
                        <div className={styles.variationImageColumn}>
                          <ImageGallery
                            previews={variationImagePreviews}
                            selectedIndex={selectedVariationImageIndex}
                            imageNames={[]}
                            onSelectImage={setSelectedVariationImageIndex}
                            onAddImages={onPickVariationImages}
                            onRemoveImage={onRemoveVariationImage}
                          />
                        </div>

                        <div className={styles.variationInfoColumn}>
                          <div className={styles.variationInfoRow}>
                            <div className={styles.field}>
                              <span className={styles.label}>Cor</span>
                              <div className={styles.colorSwatches}>
                                {PRODUCT_COLORS.map((c) => (
                                  <button
                                    key={c.hex}
                                    type="button"
                                    title={c.label}
                                    className={`${styles.colorSwatch} ${
                                      variationColor === c.hex
                                        ? styles.colorSwatchActive
                                        : ""
                                    }`}
                                    style={{ background: c.hex }}
                                    onClick={() =>
                                      setVariationColor(
                                        variationColor === c.hex ? "" : c.hex,
                                      )
                                    }
                                  />
                                ))}
                                <div className={styles.colorPickerWrapper}>
                                  <button
                                    type="button"
                                    title="Cor personalizada"
                                    className={`${styles.colorSwatch} ${styles.colorSwatchCustom} ${
                                      variationColor &&
                                      !PRODUCT_COLORS.some(
                                        (c) => c.hex === variationColor,
                                      )
                                        ? styles.colorSwatchActive
                                        : ""
                                    }`}
                                    style={{
                                      background:
                                        variationColor &&
                                        !PRODUCT_COLORS.some(
                                          (c) => c.hex === variationColor,
                                        )
                                          ? variationColor
                                          : undefined,
                                    }}
                                    onClick={() =>
                                      setShowVariationColorPicker((v) => !v)
                                    }
                                  >
                                    {!(
                                      variationColor &&
                                      !PRODUCT_COLORS.some(
                                        (c) => c.hex === variationColor,
                                      )
                                    ) && (
                                      <span
                                        className={styles.colorSwatchCustomIcon}
                                      >
                                        +
                                      </span>
                                    )}
                                  </button>
                                  {showVariationColorPicker && (
                                    <div className={styles.colorPickerPopover}>
                                      <input
                                        type="color"
                                        className={styles.colorPickerNative}
                                        value={variationColor || "#000000"}
                                        onChange={(e) =>
                                          setVariationColor(e.target.value)
                                        }
                                      />
                                      <button
                                        type="button"
                                        className={styles.colorPickerConfirm}
                                        onClick={() =>
                                          setShowVariationColorPicker(false)
                                        }
                                      >
                                        OK
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <label className={styles.field}>
                              <span className={styles.label}>Tamanho</span>
                              <input
                                className={styles.input}
                                placeholder="Ex: M"
                                value={variationSize}
                                onChange={(event) =>
                                  setVariationSize(event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <div className={styles.variationInfoRow}>
                            <label className={styles.field}>
                              <span className={styles.label}>
                                Preço (opcional)
                              </span>
                              <input
                                className={styles.input}
                                placeholder="0,00"
                                value={variationPrice}
                                onChange={(event) =>
                                  setVariationPrice(event.target.value)
                                }
                              />
                            </label>
                            <label className={styles.field}>
                              <span className={styles.label}>Estoque</span>
                              <input
                                className={styles.input}
                                placeholder="0"
                                value={variationStock}
                                onChange={(event) =>
                                  setVariationStock(event.target.value)
                                }
                              />
                            </label>
                            <div className={styles.field} style={{ minWidth: 180 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span className={styles.label}>Alerta de estoque</span>
                                <button
                                  type="button"
                                  className={`${styles.toggleSwitch} ${variationLowStockAlertEnabled ? styles.toggleSwitchActive : ""}`}
                                  onClick={() => setVariationLowStockAlertEnabled((v) => !v)}
                                  style={{ marginLeft: 8 }}
                                >
                                  <span className={styles.toggleSlider} />
                                </button>
                              </div>
                              {variationLowStockAlertEnabled && (
                                <input
                                  className={styles.input}
                                  placeholder="5"
                                  value={variationLowStock}
                                  onChange={(e) => setVariationLowStock(e.target.value)}
                                  style={{ marginTop: 4 }}
                                />
                              )}
                            </div>
                          </div>

                          <label
                            className={`${styles.field} ${styles.variationInfoFull}`}
                          >
                            <span className={styles.label}>Status</span>
                            <select
                              className={styles.select}
                              value={variationIsActive ? "true" : "false"}
                              onChange={(event) =>
                                setVariationIsActive(
                                  event.target.value === "true",
                                )
                              }
                            >
                              <option value="true">Ativo</option>
                              <option value="false">Inativo</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className={styles.variationFormFooter}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCloseVariationForm}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={styles.addBtn}
                        onClick={onAddVariation}
                      >
                        {editingVariationIndex !== null
                          ? "Salvar alteração"
                          : "Adicionar"}
                      </button>
                    </div>
                  </div>
                )}

                {variations.length > 0 && (
                  <div className={styles.variationsList}>
                    {variations.map((variation, index) => {
                      const imgs = (variation.images || []) as any[];
                      const imageUrl = imgs.map((img) =>
                        img instanceof File
                          ? {
                              id: "",
                              fileName: "",
                              url: URL.createObjectURL(img),
                              isPrimary: false,
                            }
                          : {
                              id: img.id || "",
                              fileName: img.fileName || "",
                              url: img.url || "",
                              isPrimary: false,
                            },
                      );
                      return (
                        <div
                          key={index}
                          className={styles.variationCardWrapper}
                          style={{ position: "relative" }}
                          onMouseEnter={(e) => {
                            const el = (
                              e.currentTarget as HTMLElement
                            ).querySelector(
                              ".variation-actions-hover",
                            ) as HTMLElement;
                            if (el) {
                              el.style.opacity = "1";
                              el.style.pointerEvents = "auto";
                            }
                          }}
                          onMouseLeave={(e) => {
                            const el = (
                              e.currentTarget as HTMLElement
                            ).querySelector(
                              ".variation-actions-hover",
                            ) as HTMLElement;
                            if (el) {
                              el.style.opacity = "0";
                              el.style.pointerEvents = "none";
                            }
                          }}
                        >
                          <div
                            className="variation-actions-hover"
                            style={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              display: "flex",
                              gap: 6,
                              zIndex: 2,
                              opacity: 0,
                              pointerEvents: "none",
                              transition: "opacity 0.15s",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => onRemoveVariation(index)}
                              aria-label="Deletar variação"
                              style={{
                                color: "#fff",
                                background: "#ef4444",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <FiTrash2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditVariation(index)}
                              aria-label="Editar variação"
                              style={{
                                color: "#444",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                          <EntityCard
                            id={String(index)}
                            name={
                              variation.name ||
                              `${variation.color ?? ""} ${variation.size ?? ""}`.trim() ||
                              `Variação ${index + 1}`
                            }
                            description={undefined}
                            category={category}
                            price={variation.price ?? 0}
                            imageUrl={imageUrl}
                            stock={Number(variation.stock)}
                            lowStock={0}

                            available
                            color={variation.color}
                            size={variation.size}
                            status={
                              variation.isActive !== false
                                ? ProductStatusEnum.ACTIVED
                                : ProductStatusEnum.DISABLED
                            }
                            navigateTo=""
                            onEdit={() => onEditVariation(index)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
