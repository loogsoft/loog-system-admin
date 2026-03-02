import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetails.module.css";
import { ProductCategoryEnum } from "../../dtos/enums/product-category.enum";
import { ProductStatusEnum } from "../../dtos/enums/product-status.enum";
import { ProductService } from "../../service/Product.service";
import type { ProductRequest } from "../../dtos/request/product-request.dto";
import type { ProductVariationRequestDto } from "../../dtos/request/product-variation-request.dto";
import type { ProductVariationResponseDto } from "../../dtos/response/product-variation-response.dto";
import { Save, Plus, X } from "lucide-react";
import { ImageGallery } from "../../components/ImageGallery";

type Variation = ProductVariationRequestDto | ProductVariationResponseDto;

export function ProductsDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const variationFileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategoryEnum>(
    ProductCategoryEnum.SHIRT,
  );
  const [status, setStatus] = useState<ProductStatusEnum>(
    ProductStatusEnum.ACTIVED,
  );
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [stockEnabled, setStockEnabled] = useState(true);
  const [stock, setStock] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Variation states
  const [variations, setVariations] = useState<Variation[]>([
    {
      name: "Preto P",
      color: "Preto",
      size: "P",
      price: 49.99,
      stock: 15,
      isActive: true,
      images: undefined,
    },
  ]);
  const [expandedVariationForm, setExpandedVariationForm] = useState(false);
  const [variationPrice, setVariationPrice] = useState("");
  const [variationStock, setVariationStock] = useState("");
  const [variationColor, setVariationColor] = useState("");
  const [variationSize, setVariationSize] = useState("");
  const [variationIsActive, setVariationIsActive] = useState(true);
  const [variationImageFiles, setVariationImageFiles] = useState<File[]>([]);
  const [variationImagePreviews, setVariationImagePreviews] = useState<
    string[]
  >([]);
  const [selectedVariationImageIndex, setSelectedVariationImageIndex] =
    useState(0);
  const [editingVariationIndex, setEditingVariationIndex] = useState<
    number | null
  >(null);
  const editingVariationFileInputRef = useRef<HTMLInputElement | null>(null);

  const categoryOptions = useMemo(() => Object.values(ProductCategoryEnum), []);
  const statusOptions = useMemo(() => Object.values(ProductStatusEnum), []);

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
      setLowStock(String(data.lowStock ?? ""));
      setStockEnabled(!!data.isActiveStock);
      setStock(String(data.stock ?? ""));
      setImageNames((data.images || []).map((img) => img.fileName));
      setImageFiles([]);
      setImagePreviews((data.images || []).map((img) => img.url));
      setSelectedImageIndex(0);
      // Load variations but clean them to remove response-only fields
      const cleanLoadedVariations = (data.variations || []).map((v) => ({
        name: v.name,
        price: v.price,
        stock: v.stock,
        isActive: v.isActive ?? true,
        color: v.color,
        size: v.size,
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
    setImageNames((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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
    setExpandedVariationForm(true);
  };

  const onCloseVariationForm = () => {
    setExpandedVariationForm(false);
    setVariationImageFiles([]);
    setVariationImagePreviews([]);
    setSelectedVariationImageIndex(0);
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

    const newVariation: ProductVariationRequestDto = {
      name: `${variationColor.trim()} ${variationSize.trim()}`,
      price: variationPrice.trim() ? Number(toDot(variationPrice)) : undefined,
      stock: Number(variationStock),
      color: variationColor.trim(),
      size: variationSize.trim(),
      isActive: variationIsActive,
      images: variationImageFiles.length > 0 ? variationImageFiles : undefined,
    };

    setVariations([...variations, newVariation]);
    onCloseVariationForm();
  };

  const onRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const onPickEditingVariationImages = () => {
    editingVariationFileInputRef.current?.click();
  };

  const onEditingVariationImagesSelected = (
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

  const onAddImagesToVariation = (variationIdx: number) => {
    if (variationImageFiles.length === 0) return;

    const updatedVariations = [...variations];
    const currentVariation = updatedVariations[variationIdx];

    const currentImages = currentVariation.images || [];
    const newImages = Array.isArray(currentImages) ? [...currentImages] : [];

    updatedVariations[variationIdx] = {
      ...currentVariation,
      images: [...newImages, ...variationImageFiles] as any,
    };

    setVariations(updatedVariations);
    setEditingVariationIndex(null);
    setVariationImageFiles([]);
    setVariationImagePreviews([]);
  };

  const onRemoveVariationImageFromList = (
    variationIdx: number,
    imageIdx: number,
  ) => {
    const updatedVariations = [...variations];
    const currentVariation = updatedVariations[variationIdx];
    const currentImages = currentVariation.images || [];

    if (Array.isArray(currentImages)) {
      updatedVariations[variationIdx] = {
        ...currentVariation,
        images: currentImages.filter((_, i) => i !== imageIdx) as any,
      };
    }

    setVariations(updatedVariations);
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

    if (!price.trim()) {
      alert("Preço do produto é obrigatório");
      return;
    }

    if (stockEnabled && !stock.trim()) {
      alert(
        "Quantidade em estoque é obrigatória quando controle de estoque está ativo",
      );
      return;
    }

    // Clean variations: keep ONLY fields expected by backend
    // Remove: id, createdAt, updatedAt, createdBy, updatedBy, images, etc
    const cleanVariations =
      variations.length > 0
        ? variations.map((variation) => {
            let priceValue: number | undefined = undefined;
            if (typeof variation.price === "string") {
              priceValue = variation.price.trim()
                ? Number(toDot(variation.price))
                : undefined;
            } else if (typeof variation.price === "number") {
              priceValue = variation.price;
            }

            return {
              name: variation.name,
              price: priceValue,
              stock: Number(variation.stock) || 0,
              isActive: variation.isActive ?? true,
              color: variation.color,
              size: variation.size,
            };
          })
        : undefined;

    const payload: ProductRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      status,
      price: Number(toDot(price)),
      promoPrice: promoPrice.trim() ? Number(toDot(promoPrice)) : undefined,
      lowStock: Number(lowStock || "0"),
      isActiveStock: stockEnabled,
      stock: stockEnabled ? Number(stock || 0) : 0,
      variations: cleanVariations,
      supplierId: supplierId.trim() || undefined,
    } as ProductRequest;

    try {
      setSaving(true);
      if (isEdit && id) {
        // TODO: Handle variation image uploads separately on edit
        await ProductService.update(id, payload);
        navigate(-1);
        return;
      }

      // TODO: Handle variation image uploads separately on create
      await ProductService.create(payload, imageFiles);
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = isEdit ? "Salvar alteracoes" : "Criar produto";
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
      <input
        ref={editingVariationFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onEditingVariationImagesSelected}
      />

      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>
            {isEdit ? "Editar produto" : "Cadastro de novo produto"}
          </h1>
          <p className={styles.subtitle}>
            {isEdit
              ? "Atualize as informacoes principais do produto."
              : "Preencha as informacoes principais do produto."}
          </p>
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

        <div className={styles.formColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Informacoes do produto</span>
            </div>

            <div className={styles.form}>
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
                <span className={styles.label}>Descricao</span>
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
                        {option}
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

              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Preco</span>
                  <input
                    className={styles.input}
                    placeholder="0,00"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Preco promocional</span>
                  <input
                    className={styles.input}
                    placeholder="0,00"
                    value={promoPrice}
                    onChange={(event) => setPromoPrice(event.target.value)}
                  />
                </label>
              </div>

              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Controle de estoque</span>
                  <select
                    className={styles.select}
                    value={stockEnabled ? "true" : "false"}
                    onChange={(event) =>
                      setStockEnabled(event.target.value === "true")
                    }
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Desativado</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Quantidade</span>
                  <input
                    className={styles.input}
                    placeholder="0"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Estoque baixo (alerta)</span>
                <input
                  className={styles.input}
                  placeholder="5"
                  value={lowStock}
                  onChange={(event) => setLowStock(event.target.value)}
                />
              </label>
            </div>
          </section>

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
                    <h3 className={styles.variationFormTitle}>Nova variação</h3>
                  </div>

                  <div className={styles.variationFormBody}>
                    <div className={styles.variationCardContent}>
                      {/* Coluna Esquerda: Fotos */}
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

                      {/* Coluna Direita: Informações */}
                      <div className={styles.variationInfoColumn}>
                        <div className={styles.variationInfoRow}>
                          <label className={styles.field}>
                            <span className={styles.label}>Cor</span>
                            <input
                              className={styles.input}
                              placeholder="Ex: Preta"
                              value={variationColor}
                              onChange={(event) =>
                                setVariationColor(event.target.value)
                              }
                            />
                          </label>
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
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {isEdit && variations.length > 0 && (
                <div className={styles.variationsList}>
                  {variations.map((variation, index) => (
                    <div key={index} className={styles.variationFormCard}>
                      <div className={styles.variationFormHeader}>
                        <h3 className={styles.variationFormTitle}>
                          {variation.name}
                        </h3>
                        <button
                          type="button"
                          className={styles.removeVariationBtn}
                          onClick={() => onRemoveVariation(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className={styles.variationFormBody}>
                        <div className={styles.variationCardContent}>
                          {/* Coluna Esquerda: Fotos */}
                          <div className={styles.variationImageColumn}>
                            <ImageGallery
                              previews={
                                variation.images && variation.images.length > 0
                                  ? variation.images.map((img) => {
                                      if (img instanceof File) {
                                        return URL.createObjectURL(img);
                                      }
                                      // ImageResponse object
                                      return (img as any).url || "";
                                    })
                                  : []
                              }
                              selectedIndex={0}
                              imageNames={[]}
                              onSelectImage={() => {}}
                              onAddImages={() =>
                                setEditingVariationIndex(index)
                              }
                              onRemoveImage={(imgIdx) =>
                                onRemoveVariationImageFromList(index, imgIdx)
                              }
                            />
                          </div>

                          {/* Coluna Direita: Informações */}
                          <div className={styles.variationInfoColumn}>
                            <div className={styles.variationInfoRow}>
                              <label className={styles.field}>
                                <span className={styles.label}>Cor</span>
                                <input
                                  className={styles.input}
                                  placeholder="Ex: Preta"
                                  value={variation.color}
                                  disabled
                                  onChange={() => {}}
                                />
                              </label>
                              <label className={styles.field}>
                                <span className={styles.label}>Tamanho</span>
                                <input
                                  className={styles.input}
                                  placeholder="Ex: M"
                                  value={variation.size}
                                  disabled
                                  onChange={() => {}}
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
                                  value={
                                    variation.price
                                      ? String(variation.price).replace(
                                          ".",
                                          ",",
                                        )
                                      : ""
                                  }
                                  disabled
                                  onChange={() => {}}
                                />
                              </label>
                              <label className={styles.field}>
                                <span className={styles.label}>Estoque</span>
                                <input
                                  className={styles.input}
                                  placeholder="0"
                                  value={variation.stock}
                                  disabled
                                  onChange={() => {}}
                                />
                              </label>
                            </div>

                            <label
                              className={`${styles.field} ${styles.variationInfoFull}`}
                            >
                              <span className={styles.label}>Status</span>
                              <select
                                className={styles.select}
                                value={variation.isActive ? "true" : "false"}
                                disabled
                                onChange={() => {}}
                              >
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                              </select>
                            </label>
                          </div>
                        </div>

                        {editingVariationIndex === index && (
                          <div
                            className={styles.variationImagesSection}
                            style={{
                              marginTop: "16px",
                              paddingTop: "16px",
                              borderTop: "1px solid var(--border-light)",
                            }}
                          >
                            <label className={styles.label}>
                              Adicionar fotos à variação
                            </label>
                            <div className={styles.variationImagesWrapper}>
                              {variationImagePreviews.length > 0 ? (
                                <>
                                  <img
                                    src={variationImagePreviews[0]}
                                    alt="Nova foto"
                                    className={styles.variationImagePreview}
                                  />
                                  {variationImagePreviews.length > 1 && (
                                    <div
                                      className={
                                        styles.variationImageThumbnails
                                      }
                                    >
                                      {variationImagePreviews.map(
                                        (preview, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            className={
                                              styles.variationThumbnail
                                            }
                                            type="button"
                                            onClick={() =>
                                              setVariationImageFiles(
                                                variationImageFiles.filter(
                                                  (_, i) => i !== imgIdx,
                                                ),
                                              )
                                            }
                                          >
                                            <img
                                              src={preview}
                                              alt={`Thumbnail ${imgIdx + 1}`}
                                            />
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className={styles.emptyVariationImages}>
                                  <div className={styles.emptyIcon}>📷</div>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className={styles.addVariationImageBtn}
                              onClick={onPickEditingVariationImages}
                            >
                              <Plus size={14} />
                              Selecionar fotos
                            </button>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "8px",
                              }}
                            >
                              <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => {
                                  setEditingVariationIndex(null);
                                  setVariationImageFiles([]);
                                  setVariationImagePreviews([]);
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className={styles.addBtn}
                                onClick={() => onAddImagesToVariation(index)}
                              >
                                Adicionar fotos
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
