import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Barcode,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { ProductResponse } from "../../dtos/response/product-response.dto";
import type { CreditCustomerResponseDto } from "../../dtos/response/credit-customer-response.dto";
import { CreditCustomerService } from "../../service/Credit-customer.service";
import { useAuth } from "../../contexts/useAuth";
import styles from "./StockScanCart.module.css";
import axios from "axios";

export type StockScanCartItem = {
  product: ProductResponse;
  stockItemId: string;
  stockItemType: "product" | "variation";
  stockItemLabel: string;
  maxStock: number;
  unitPrice: number;
  imageUrl?: string;
  barCode?: string;
  quantity: number;
};

export type StockScanOperationData = {
  reason: string;
  paymentMethod: string;
  responsibleName: string;
  observation: string;
  discountPercent?: number;
  creditCustomerId?: string;
  installment?: number;
};

type StockScanCartProps = {
  isOpen: boolean;
  items: StockScanCartItem[];
  onClose: () => void;
  onChangeQuantity: (stockItemId: string, quantity: number) => void;
  onRemove: (stockItemId: string) => void;
  onConfirm: (data: StockScanOperationData) => void | Promise<void>;
  isConfirming?: boolean;
};

const REASONS = ["Venda", "Consumo interno", "Devolução", "Perda"];
const PAYMENT_METHODS = ["PIX", "Dinheiro", "Crédito", "Débito", "Crediario"];
const INSTALLMENT_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DISCOUNT_STEP_PERCENT = 1;
const INITIAL_DISCOUNT_PERCENT = 5;
const MAX_DISCOUNT_PERCENT = 100;
const MAX_SHORT_TEXT_LENGTH = 80;
const MAX_TEXT_LENGTH = 120;
const MAX_EMAIL_LENGTH = 160;
const MAX_OBSERVATION_LENGTH = 500;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const sanitizeDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const stripControlCharacters = (value: string) =>
  Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");

const sanitizeText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  stripControlCharacters(value)
    .replace(/\s{2,}/g, " ")
    .slice(0, maxLength);

const sanitizeName = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  sanitizeText(value.replace(/[^\p{L}\p{M}\s.'-]/gu, ""), maxLength);

const sanitizeEmail = (value: string) =>
  value
    .replace(/\s/g, "")
    .replace(/[^A-Za-z0-9.!#$%&'*+/=?^_`{|}~@-]/g, "")
    .toLowerCase()
    .slice(0, MAX_EMAIL_LENGTH);

const sanitizeState = (value: string) =>
  value
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 2);

const sanitizeAddressNumber = (value: string) =>
  sanitizeText(value.replace(/[^\p{L}\p{M}\p{N}\s./-]/gu, ""), 20);

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function phoneMask(value: string): string {
  if (!value) return "";
  const normalized = sanitizeDigits(value, 11);
  if (normalized.length <= 10) {
    return normalized
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return normalized
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function cpfMask(value: string): string {
  if (!value) return "";
  return sanitizeDigits(value, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function cepMask(value: string): string {
  if (!value) return "";
  return sanitizeDigits(value, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

const getCreditCustomerSearchText = (customer: CreditCustomerResponseDto) =>
  normalizeSearchText(
    [
      customer.customerName,
      customer.customerEmail,
      customer.CPF,
      cpfMask(customer.CPF),
      customer.phone,
      phoneMask(customer.phone),
      customer.road,
      customer.number,
      customer.neighborhood,
      customer.city,
      customer.state,
      customer.zipCode,
      cepMask(customer.zipCode),
    ]
      .filter(Boolean)
      .join(" "),
  );

export function StockScanCart({
  isOpen,
  items,
  onClose,
  onChangeQuantity,
  onRemove,
  onConfirm,
  isConfirming = false,
}: StockScanCartProps) {
  const { user } = useAuth();
  const operatorName = user?.name || user?.email || "";
  const [form, setForm] = useState<StockScanOperationData>({
    reason: "Venda",
    paymentMethod: "PIX",
    responsibleName: "",
    observation: "",
    installment: 1,
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState<"products" | "details">("products");
  const [discountPercent, setDiscountPercent] = useState(
    INITIAL_DISCOUNT_PERCENT,
  );
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditModalMode, setCreditModalMode] = useState<"list" | "create">(
    "list",
  );
  const [selectedCreditCustomerId, setSelectedCreditCustomerId] = useState<
    string | null
  >(null);
  const [creditError, setCreditError] = useState("");
  const [creditCustomers, setCreditCustomers] = useState<
    CreditCustomerResponseDto[]
  >([]);
  const [creditForm, setCreditForm] = useState({
    customerName: "",
    customerEmail: "",
    CPF: "",
    phone: "",
    road: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [creditCustomerSearch, setCreditCustomerSearch] = useState("");

  const updateCreditForm = (field: keyof typeof creditForm, value: string) => {
    setCreditForm((current) => ({
      ...current,
      [field]: value,
    }));
    setCreditError("");
  };

  const resetCreditForm = () => {
    setCreditForm({
      customerName: "",
      customerEmail: "",
      CPF: "",
      phone: "",
      road: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setCreditError("");
  };

  const fetchCreditCustomers = async () => {
    try {
      setCreditLoading(true);
      const data = await CreditCustomerService.findAll();
      setCreditCustomers(
        data.map((customer) => ({
          ...customer,
          id: String(customer.id),
        })),
      );
    } catch (err) {
      console.error(err);
      setCreditError("Erro ao carregar clientes.");
    } finally {
      setCreditLoading(false);
    }
  };

  const handleCreditModalClose = () => {
    setCreditModalOpen(false);
    setCreditModalMode("list");
    setCreditCustomerSearch("");
    resetCreditForm();
  };

  useEffect(() => {
    if (!isOpen) {
      setStep("products");
      setError("");
      setCreditModalOpen(false);
      setCreditModalMode("list");
      setCreditCustomerSearch("");
      setSelectedCreditCustomerId(null);
      setInstallmentOpen(false);
      setDiscountPercent(INITIAL_DISCOUNT_PERCENT);
      resetCreditForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (creditModalOpen) {
      void fetchCreditCustomers();
    }
  }, [creditModalOpen]);

  useEffect(() => {
    if (items.length === 0) {
      setStep("products");
    }
  }, [items.length]);

  if (!isOpen) return null;

  const totalUnits = items.reduce((total, item) => total + item.quantity, 0);
  const subtotalValue = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const discountValue = subtotalValue * (discountPercent / 100);
  const totalValue = Math.max(subtotalValue - discountValue, 0);
  const installment = form.installment ?? 1;
  const installmentValue = totalValue / installment;
  const selectedCreditCustomer = creditCustomers.find(
    (customer) => String(customer.id) === String(selectedCreditCustomerId),
  );
  const creditCustomerSearchTerm = normalizeSearchText(
    creditCustomerSearch.trim(),
  );
  const filteredCreditCustomers = creditCustomerSearchTerm
    ? creditCustomers.filter((customer) =>
        getCreditCustomerSearchText(customer).includes(
          creditCustomerSearchTerm,
        ),
      )
    : creditCustomers;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formatCreditLocation = (customer: CreditCustomerResponseDto) =>
    [customer.city, customer.state].filter(Boolean).join(" • ");

  const handleCreateCredit = async () => {
    if (creditSaving) return;

    const sanitizedCreditForm = {
      customerName: sanitizeName(creditForm.customerName).trim(),
      customerEmail: sanitizeEmail(creditForm.customerEmail).trim(),
      CPF: sanitizeDigits(creditForm.CPF, 11),
      phone: sanitizeDigits(creditForm.phone, 11),
      road: sanitizeText(creditForm.road).trim(),
      number: sanitizeAddressNumber(creditForm.number).trim(),
      neighborhood: sanitizeText(
        creditForm.neighborhood,
        MAX_SHORT_TEXT_LENGTH,
      ).trim(),
      city: sanitizeName(creditForm.city, MAX_SHORT_TEXT_LENGTH).trim(),
      state: sanitizeState(creditForm.state),
      zipCode: sanitizeDigits(creditForm.zipCode, 8),
    };

    setCreditForm(sanitizedCreditForm);

    if (!sanitizedCreditForm.customerName) {
      setCreditError("Informe o nome do cliente.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !sanitizedCreditForm.customerEmail ||
      !emailRegex.test(sanitizedCreditForm.customerEmail)
    ) {
      setCreditError("Informe um e-mail válido.");
      return;
    }

    if (sanitizedCreditForm.CPF.length !== 11) {
      setCreditError("CPF deve conter 11 dígitos.");
      return;
    }

    if (sanitizedCreditForm.phone.length < 10) {
      setCreditError("Informe um telefone válido.");
      return;
    }

    if (
      !sanitizedCreditForm.road ||
      !sanitizedCreditForm.number ||
      !sanitizedCreditForm.neighborhood ||
      !sanitizedCreditForm.city
    ) {
      setCreditError("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    if (sanitizedCreditForm.state.length !== 2) {
      setCreditError("Estado deve conter a UF com 2 letras.");
      return;
    }

    if (sanitizedCreditForm.zipCode.length !== 8) {
      setCreditError("CEP deve conter 8 dígitos.");
      return;
    }

    try {
      setCreditSaving(true);
      setCreditError("");
      const createdCustomer =
        await CreditCustomerService.create(sanitizedCreditForm);
      await fetchCreditCustomers();
      setSelectedCreditCustomerId(String(createdCustomer.id));
      setCreditCustomerSearch("");
      resetCreditForm();
      setCreditModalMode("list");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCreditError(
          err.response?.data?.message ||
            "Erro ao criar crediário. Tente novamente.",
        );
      }
      console.error(err);
    } finally {
      setCreditSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (items.length === 0 || isConfirming) return;

    if (!operatorName.trim() || !user?.email?.trim()) {
      setError("Não foi possível identificar o usuário logado.");
      return;
    }

    const reason = REASONS.includes(form.reason) ? form.reason : REASONS[0];
    const paymentMethod = PAYMENT_METHODS.includes(form.paymentMethod)
      ? form.paymentMethod
      : PAYMENT_METHODS[0];
    const safeInstallment = INSTALLMENT_LIST.includes(installment)
      ? installment
      : 1;
    const safeDiscountPercent = Math.min(
      Math.max(Number(discountPercent || 0), 0),
      MAX_DISCOUNT_PERCENT,
    );
    const observation = sanitizeText(
      form.observation,
      MAX_OBSERVATION_LENGTH,
    ).trim();

    if (
      paymentMethod === "Crediario" &&
      !String(selectedCreditCustomerId ?? "").trim()
    ) {
      setError("Selecione um cliente do crediário antes de confirmar.");
      return;
    }

    setError("");
    await onConfirm({
      ...form,
      reason,
      paymentMethod,
      responsibleName: operatorName,
      observation,
      discountPercent: safeDiscountPercent,
      creditCustomerId:
        paymentMethod === "Crediario"
          ? String(selectedCreditCustomerId)
          : undefined,
      installment: paymentMethod === "Crediario" ? safeInstallment : 1,
    });
  };

  return (
    <aside
      className={`${styles.drawer} ${
        step === "details" ? styles.drawerDetails : ""
      }`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="scan-cart-title"
    >
      <header className={styles.header}>
        <div className={styles.headingIcon}>
          <ShoppingCart size={20} aria-hidden="true" />
        </div>
        <div className={styles.headingText}>
          <span className={styles.eyebrow}>BAIXA EM LOTE</span>
          <h2 id="scan-cart-title">
            {step === "products" ? "Produtos selecionados" : "Dados da baixa"}
          </h2>
        </div>
        <button
          className={styles.closeButton}
          type="button"
          onClick={onClose}
          aria-label="Fechar produtos selecionados"
        >
          <X size={18} />
        </button>
      </header>

      <div className={styles.stepper}>
        <span
          className={`${styles.stepPill} ${
            step === "products" ? styles.stepPillActive : ""
          }`}
        >
          1. Produtos
        </span>
        <span
          className={`${styles.stepPill} ${
            step === "details" ? styles.stepPillActive : ""
          }`}
        >
          2. Confirmação
        </span>
      </div>

      {step === "products" ? (
        <>
          <div className={styles.scanHint}>
            <Barcode size={17} aria-hidden="true" />
            <span>Continue lendo códigos para adicionar mais produtos.</span>
          </div>

          <div className={styles.items}>
            {items.map((item) => {
              const { product, quantity } = item;
              const imageUrl = item.imageUrl ?? product.images?.[0]?.url;

              return (
                <article className={styles.item} key={item.stockItemId}>
                  <div className={styles.productImage}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" />
                    ) : (
                      <Package size={22} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles.productContent}>
                    <div className={styles.productHeader}>
                      <div>
                        <strong>{product.name}</strong>
                        <span>
                          {item.stockItemLabel}
                          {item.barCode ? ` • ${item.barCode}` : ""}
                        </span>
                      </div>
                      <button
                        className={styles.removeButton}
                        type="button"
                        onClick={() => onRemove(item.stockItemId)}
                        aria-label={`Remover ${product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className={styles.itemFooter}>
                      <div className={styles.quantityControl}>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeQuantity(item.stockItemId, quantity - 1)
                          }
                          aria-label={`Diminuir quantidade de ${product.name}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeQuantity(item.stockItemId, quantity + 1)
                          }
                          disabled={quantity >= item.maxStock}
                          aria-label={`Aumentar quantidade de ${product.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className={styles.stockInfo}>
                        <strong>
                          {formatCurrency(
                            Number(item.unitPrice || 0) * quantity,
                          )}
                        </strong>
                        <span>{item.maxStock} em estoque</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <footer className={styles.footer}>
            <div className={styles.summary}>
              <span>
                {items.length} produto{items.length === 1 ? "" : "s"} •{" "}
                {totalUnits} unidade{totalUnits === 1 ? "" : "s"}
              </span>
              <strong>{formatCurrency(subtotalValue)}</strong>
            </div>
            <button
              className={styles.confirmButton}
              type="button"
              disabled={items.length === 0 || isConfirming}
              onClick={() => {
                setError("");
                setStep("details");
              }}
            >
              Continuar
            </button>
          </footer>
        </>
      ) : (
        <>
          <div className={styles.details}>
            <div className={styles.reviewBox}>
              <span>Resumo da baixa</span>
              <div className={styles.reviewAmountRow}>
                <div className={styles.reviewAmount}>
                  {discountPercent > 0 && (
                    <small>{formatCurrency(subtotalValue)}</small>
                  )}
                  <strong>{formatCurrency(totalValue)}</strong>
                </div>

                <div className={styles.discountControl}>
                  <button
                    type="button"
                    className={styles.discountIncrease}
                    onClick={() =>
                      setDiscountPercent((current) =>
                        Math.min(
                          current + DISCOUNT_STEP_PERCENT,
                          MAX_DISCOUNT_PERCENT,
                        ),
                      )
                    }
                    disabled={discountPercent >= MAX_DISCOUNT_PERCENT}
                    aria-label="Aumentar desconto"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <strong>{discountPercent}%</strong>
                  <button
                    type="button"
                    className={styles.discountDecrease}
                    onClick={() =>
                      setDiscountPercent((current) =>
                        Math.max(current - DISCOUNT_STEP_PERCENT, 0),
                      )
                    }
                    disabled={discountPercent <= 0}
                    aria-label="Diminuir desconto"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              <small>
                {items.length} produto{items.length === 1 ? "" : "s"} •{" "}
                {totalUnits} unidade{totalUnits === 1 ? "" : "s"}
              </small>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.labelText}>
                  <Tag className={styles.labelIcon} size={14} />
                  Motivo da baixa
                </span>
                <select
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reason: REASONS.includes(event.target.value)
                        ? event.target.value
                        : REASONS[0],
                    }))
                  }
                >
                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.labelText}>
                  <CreditCard className={styles.labelIcon} size={14} />
                  Forma de pagamento
                </span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => {
                    const paymentMethod = PAYMENT_METHODS.includes(
                      event.target.value,
                    )
                      ? event.target.value
                      : PAYMENT_METHODS[0];
                    setError("");
                    setForm((current) => ({
                      ...current,
                      paymentMethod,
                      installment:
                        paymentMethod === "Crediario"
                          ? (current.installment ?? 1)
                          : 1,
                    }));
                    if (paymentMethod !== "Crediario") {
                      setSelectedCreditCustomerId(null);
                    }
                    setInstallmentOpen(false);
                    setCreditModalMode("list");
                    setCreditError("");
                    setCreditModalOpen(paymentMethod === "Crediario");
                  }}
                >
                  {PAYMENT_METHODS.map((paymentMethod) => (
                    <option key={paymentMethod} value={paymentMethod}>
                      {paymentMethod}
                    </option>
                  ))}
                </select>
              </label>

              {form.paymentMethod === "Crediario" && (
                <>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.labelText}>
                      <CreditCard className={styles.labelIcon} size={14} />
                      Cliente do crediário
                    </span>
                    <button
                      type="button"
                      className={styles.creditTrigger}
                      onClick={() => {
                        setCreditModalMode("list");
                        setCreditError("");
                        setCreditModalOpen(true);
                      }}
                    >
                      <span className={styles.creditTriggerTitle}>
                        {selectedCreditCustomer
                          ? selectedCreditCustomer.customerName
                          : "Ver clientes do crediário"}
                      </span>
                      <span className={styles.creditTriggerMeta}>
                        {selectedCreditCustomer
                          ? "Cliente selecionado"
                          : creditCustomers.length > 0
                            ? `${creditCustomers.length} cliente${creditCustomers.length > 1 ? "s" : ""} cadastrado${creditCustomers.length > 1 ? "s" : ""}`
                            : "Nenhum cliente cadastrado"}
                      </span>
                    </button>
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.labelText}>
                      <Calendar className={styles.labelIcon} size={14} />
                      Parcelas
                    </span>
                    <div className={styles.installmentDropdown}>
                      <button
                        type="button"
                        className={`${styles.installmentTrigger} ${
                          installmentOpen ? styles.installmentTriggerOpen : ""
                        }`}
                        aria-expanded={installmentOpen}
                        aria-haspopup="listbox"
                        onClick={() => setInstallmentOpen((open) => !open)}
                      >
                        <span className={styles.installmentTriggerMain}>
                          <span className={styles.installmentTriggerTitle}>
                            {installment === 1
                              ? "1 parcela"
                              : `${installment} parcelas`}
                          </span>
                          <span className={styles.installmentTriggerMeta}>
                            {formatCurrency(installmentValue)} por parcela
                          </span>
                        </span>

                        <span className={styles.installmentTriggerAside}>
                          <span>Total da venda</span>
                          <strong>{formatCurrency(totalValue)}</strong>
                        </span>

                        <ChevronDown
                          className={`${styles.installmentChevron} ${
                            installmentOpen ? styles.installmentChevronOpen : ""
                          }`}
                          size={18}
                        />
                      </button>

                      {installmentOpen && (
                        <div
                          className={styles.installmentList}
                          role="listbox"
                          aria-label="Quantidade de parcelas"
                        >
                          {INSTALLMENT_LIST.map((item) => {
                            const optionValue = totalValue / item;
                            const isSelected = installment === item;

                            return (
                              <button
                                key={item}
                                type="button"
                                className={`${styles.installmentOption} ${
                                  isSelected
                                    ? styles.installmentOptionActive
                                    : ""
                                }`}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setForm((current) => ({
                                    ...current,
                                    installment: item,
                                  }));
                                  setInstallmentOpen(false);
                                }}
                              >
                                <span className={styles.installmentOptionCount}>
                                  <strong>{item}x</strong>
                                  <span>
                                    {item === 1
                                      ? "1 parcela"
                                      : `${item} parcelas`}
                                  </span>
                                </span>

                                <span className={styles.installmentOptionValue}>
                                  <span>Valor por parcela</span>
                                  <strong>{formatCurrency(optionValue)}</strong>
                                </span>

                                <span className={styles.installmentOptionTotal}>
                                  <span>Total</span>
                                  <strong>{formatCurrency(totalValue)}</strong>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                </>
              )}

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.labelText}>
                  <User className={styles.labelIcon} size={14} />
                  Responsável
                </span>
                <input
                  value={operatorName || "Usuário logado não identificado"}
                  readOnly
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.labelText}>
                  <Tag className={styles.labelIcon} size={14} />
                  Observação (opcional)
                </span>
                <textarea
                  rows={2}
                  value={form.observation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      observation: sanitizeText(
                        event.target.value,
                        MAX_OBSERVATION_LENGTH,
                      ),
                    }))
                  }
                  maxLength={MAX_OBSERVATION_LENGTH}
                  placeholder="Opcional"
                />
              </label>
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isConfirming}
                onClick={() => setStep("products")}
              >
                Voltar
              </button>
              <button
                className={styles.confirmButton}
                type="button"
                disabled={items.length === 0 || isConfirming}
                onClick={handleConfirm}
              >
                {isConfirming ? "Confirmando..." : "Confirmar baixa"}
              </button>
            </div>
          </footer>
        </>
      )}

      {creditModalOpen &&
        createPortal(
          <div
            className={styles.creditModalBackdrop}
            onClick={handleCreditModalClose}
          >
            <div
              className={styles.creditModal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.creditModalHeader}>
                <div>
                  <span className={styles.creditModalBadge}>Crediário</span>
                  <h3>
                    {creditModalMode === "list"
                      ? "Escolha um cliente cadastrado"
                      : "Criar novo crediário"}
                  </h3>
                  <p>
                    {creditModalMode === "list"
                      ? "Visualize os clientes disponíveis antes de seguir com a baixa."
                      : "Preencha os dados do cliente e cadastre sem sair desta tela."}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.creditModalClose}
                  onClick={handleCreditModalClose}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.creditModalBody}>
                {creditModalMode === "list" ? (
                  <>
                    <label className={styles.creditSearchField}>
                      <span>Buscar cliente</span>
                      <input
                        value={creditCustomerSearch}
                        onChange={(event) =>
                          setCreditCustomerSearch(
                            sanitizeText(event.target.value, MAX_TEXT_LENGTH),
                          )
                        }
                        placeholder="Busque por nome, CPF, telefone ou cidade"
                        autoComplete="off"
                        maxLength={MAX_TEXT_LENGTH}
                      />
                    </label>

                    {creditLoading ? (
                      <div className={styles.creditEmptyState}>
                        Carregando clientes...
                      </div>
                    ) : filteredCreditCustomers.length > 0 ? (
                      filteredCreditCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className={`${styles.creditCustomerCard} ${
                            String(selectedCreditCustomerId) ===
                            String(customer.id)
                              ? styles.creditCustomerCardSelected
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedCreditCustomerId(String(customer.id));
                            handleCreditModalClose();
                          }}
                        >
                          <div className={styles.creditCustomerAvatar}>
                            {getInitials(customer.customerName) || "?"}
                          </div>
                          <div className={styles.creditCustomerBody}>
                            <div className={styles.creditCustomerTop}>
                              <strong>{customer.customerName}</strong>
                              <span>
                                {Number(
                                  customer.totalAmounts ?? 0,
                                ).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                            <small>{customer.customerEmail}</small>
                            <small>
                              {[
                                phoneMask(customer.phone),
                                formatCreditLocation(customer),
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className={styles.creditEmptyState}>
                        <CreditCard size={36} />
                        <strong>Nenhum cliente encontrado</strong>
                        <span>
                          {creditCustomerSearch.trim()
                            ? "Ajuste o filtro ou cadastre um novo cliente."
                            : "Cadastre um novo cliente de crediário para continuar."}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.creditFormGrid}>
                    <label className={styles.creditField}>
                      <span>Nome</span>
                      <input
                        value={creditForm.customerName}
                        onChange={(event) =>
                          updateCreditForm(
                            "customerName",
                            sanitizeName(event.target.value),
                          )
                        }
                        placeholder="Nome completo"
                        autoComplete="name"
                        maxLength={MAX_TEXT_LENGTH}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Email</span>
                      <input
                        type="email"
                        value={creditForm.customerEmail}
                        onChange={(event) =>
                          updateCreditForm(
                            "customerEmail",
                            sanitizeEmail(event.target.value),
                          )
                        }
                        placeholder="email@cliente.com"
                        autoComplete="email"
                        maxLength={MAX_EMAIL_LENGTH}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>CPF</span>
                      <input
                        value={cpfMask(creditForm.CPF)}
                        onChange={(event) =>
                          updateCreditForm(
                            "CPF",
                            sanitizeDigits(event.target.value, 11),
                          )
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        maxLength={14}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Telefone</span>
                      <input
                        type="tel"
                        value={phoneMask(creditForm.phone)}
                        onChange={(event) =>
                          updateCreditForm(
                            "phone",
                            sanitizeDigits(event.target.value, 11),
                          )
                        }
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={15}
                      />
                    </label>
                    <label
                      className={`${styles.creditField} ${styles.creditFieldFull}`}
                    >
                      <span>Rua</span>
                      <input
                        value={creditForm.road}
                        onChange={(event) =>
                          updateCreditForm(
                            "road",
                            sanitizeText(event.target.value),
                          )
                        }
                        placeholder="Rua do cliente"
                        autoComplete="street-address"
                        maxLength={MAX_TEXT_LENGTH}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Número</span>
                      <input
                        value={creditForm.number}
                        onChange={(event) =>
                          updateCreditForm(
                            "number",
                            sanitizeAddressNumber(event.target.value),
                          )
                        }
                        placeholder="123"
                        maxLength={20}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Bairro</span>
                      <input
                        value={creditForm.neighborhood}
                        onChange={(event) =>
                          updateCreditForm(
                            "neighborhood",
                            sanitizeText(
                              event.target.value,
                              MAX_SHORT_TEXT_LENGTH,
                            ),
                          )
                        }
                        placeholder="Bairro"
                        autoComplete="address-level3"
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Cidade</span>
                      <input
                        value={creditForm.city}
                        onChange={(event) =>
                          updateCreditForm(
                            "city",
                            sanitizeName(
                              event.target.value,
                              MAX_SHORT_TEXT_LENGTH,
                            ),
                          )
                        }
                        placeholder="Cidade"
                        autoComplete="address-level2"
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>Estado</span>
                      <input
                        value={creditForm.state}
                        onChange={(event) =>
                          updateCreditForm(
                            "state",
                            sanitizeState(event.target.value),
                          )
                        }
                        placeholder="UF"
                        autoComplete="address-level1"
                        maxLength={2}
                      />
                    </label>
                    <label className={styles.creditField}>
                      <span>CEP</span>
                      <input
                        value={cepMask(creditForm.zipCode)}
                        onChange={(event) =>
                          updateCreditForm(
                            "zipCode",
                            sanitizeDigits(event.target.value, 8),
                          )
                        }
                        placeholder="00000-000"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        maxLength={9}
                      />
                    </label>
                  </div>
                )}

                {creditError && (
                  <div className={styles.creditFormError}>{creditError}</div>
                )}
              </div>

              <div className={styles.creditModalFooter}>
                {creditModalMode === "list" ? (
                  <button
                    type="button"
                    className={styles.creditCreateButton}
                    onClick={() => {
                      resetCreditForm();
                      setCreditCustomerSearch("");
                      setCreditModalMode("create");
                    }}
                  >
                    + Criar crediário
                  </button>
                ) : (
                  <div className={styles.creditModalActions}>
                    <button
                      type="button"
                      className={styles.creditSecondaryButton}
                      onClick={() => {
                        resetCreditForm();
                        setCreditCustomerSearch("");
                        setCreditModalMode("list");
                      }}
                    >
                      Voltar para lista
                    </button>
                    <button
                      type="button"
                      className={styles.creditCreateButton}
                      onClick={handleCreateCredit}
                      disabled={creditSaving}
                    >
                      {creditSaving ? "Criando..." : "+ Criar crediário"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
