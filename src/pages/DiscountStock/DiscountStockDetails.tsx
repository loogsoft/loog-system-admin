import { useMemo } from "react";
import styles from "./DiscountStockDetails.module.css";
import { Printer, X, ChevronDown } from "lucide-react";
import { ButtonBack } from "../../components/ButtonBack/ButtonBack";

type DiscountStockItem = {
  id: string;
  title: string;
  description?: string;
  price: number;
  iconText?: string;
  observations?: string;
};

type DiscountStockRecord = {
  id: string | number;
  statusLabel: string;
  receivedAtLabel: string;
  items: DiscountStockItem[];
  customer: {
    name: string;
    phoneLabel: string;
  };
  address: {
    street: string;
    cityState: string;
    complement?: string;
  };
  payment: {
    method: string;
    details?: string;
    paidLabel?: string;
  };
  history: {
    label: string;
    timeLabel?: string;
    status: "done" | "current" | "pending";
  }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DiscountStockDetails() {
  const discountStock: DiscountStockRecord = useMemo(
    () => ({
      id: 1234,
      statusLabel: "EM SEPARACAO",
      receivedAtLabel: "Registrado às 19:24 • Acompanhe os detalhes da baixa",
      items: [
        {
          id: "1",
          title: "Camisa Polo Premium",
          description: "Tamanho M, algodao piquet, azul marinho",
          price: 38.9,
          iconText: "👕",
          observations: "Separar no estoque e conferir etiqueta.",
        },
        {
          id: "2",
          title: "Calca Jeans Slim",
          description: "Tamanho 42, lavagem escura",
          price: 15.0,
          iconText: "👖",
        },
      ],
      customer: {
        name: "Ricardo Silva",
        phoneLabel: "(11) 98765-4321",
      },
      address: {
        street: "Av. Paulista, 1578",
        cityState: "Bela Vista - São Paulo/SP",
        complement: "Apto 42, Bloco B • Próximo ao MASP",
      },
      payment: {
        method: "Cartão de Crédito",
        details: "Final 4432 (Mastercard)",
        paidLabel: "PAGO",
      },
      history: [
        {
          label: "BAIXA REGISTRADA",
          timeLabel: "Hoje às 19:24",
          status: "done",
        },
        {
          label: "SEPARAÇÃO NO ESTOQUE",
          timeLabel: "Hoje às 19:26",
          status: "current",
        },
        {
          label: "CONFERÊNCIA FINALIZADA",
          timeLabel: "Aguardando...",
          status: "pending",
        },
        { label: "FINALIZADA", timeLabel: "Aguardando...", status: "pending" },
      ],
      subtotal: 53.9,
      deliveryFee: 7.0,
      discount: 0,
    }),
    [],
  );

  const total = useMemo(
    () => discountStock.subtotal + discountStock.deliveryFee - discountStock.discount,
    [discountStock.subtotal, discountStock.deliveryFee, discountStock.discount],
  );
  // const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <ButtonBack />

          <div className={styles.topbarTitleWrap}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Baixa #{discountStock.id}</h1>
              <span className={styles.statusPill}>{discountStock.statusLabel}</span>
            </div>
            <div className={styles.subtitle}>{discountStock.receivedAtLabel}</div>
          </div>
        </div>

        <div className={styles.topbarRight}>
          <button className={styles.btnGhost}>
            <Printer size={16} />
            Imprimir baixa
          </button>
          <button className={styles.btnDanger}>
            <X size={16} />
            Cancelar
          </button>

          <div className={styles.dropdownWrap}>
            <button className={styles.btnPrimary}>
              Alterar Status <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.headerDot}>⚠</span>
                <span className={styles.cardTitle}>ITENS DA BAIXA</span>
              </div>
              <span className={styles.cardMeta}>
                {discountStock.items.length} itens
              </span>
            </div>

            <div className={styles.itemsList}>
              {discountStock.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemIcon}>{item.iconText ?? "•"}</div>

                  <div className={styles.itemInfo}>
                    <div className={styles.itemTop}>
                      <div className={styles.itemName}>{item.title}</div>
                      <div className={styles.itemPrice}>
                        {formatBRL(item.price)}
                      </div>
                    </div>

                    {item.description ? (
                      <div className={styles.itemDesc}>{item.description}</div>
                    ) : null}

                    {item.observations ? (
                      <div className={styles.obsBox}>
                        <div className={styles.obsTitle}>OBSERVAÇÕES:</div>
                        <div className={styles.obsText}>
                          {item.observations}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.headerDot}>💳</span>
                <span className={styles.cardTitle}>RESUMO DE VALORES</span>
              </div>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryValue}>
                  {formatBRL(discountStock.subtotal)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Taxa de Operacao</span>
                <span className={styles.summaryValue}>
                  {formatBRL(discountStock.deliveryFee)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Descontos</span>
                <span className={styles.summaryValueNegative}>
                  - {formatBRL(discountStock.discount)}
                </span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.totalRow}>
                <div className={styles.totalLabel}>TOTAL DA BAIXA</div>
                <div className={styles.totalValue}>{formatBRL(total)}</div>
              </div>

              <div className={styles.paidTag}>PAGO ONLINE</div>
            </div>
          </div>
        </section>

        <aside className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardTitleMuted}>DADOS DO CLIENTE</span>
              </div>
            </div>

            <div className={styles.customerRow}>
              <div className={styles.avatar}>👤</div>
              <div className={styles.customerInfo}>
                <div className={styles.customerName}>{discountStock.customer.name}</div>
                <div className={styles.customerPhone}>
                  {discountStock.customer.phoneLabel}
                </div>
              </div>
            </div>

            <button className={styles.whatsBtn}>Abrir WhatsApp</button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardTitleMuted}>
                  ENDEREÇO DE ENTREGA
                </span>
              </div>
              <button className={styles.linkBtn}>Ver no Mapa ↗</button>
            </div>

            <div className={styles.addressBlock}>
              <div className={styles.addressLine1}>{discountStock.address.street}</div>
              <div className={styles.addressLine2}>
                {discountStock.address.cityState}
              </div>
              {discountStock.address.complement ? (
                <div className={styles.addressLine3}>
                  {discountStock.address.complement}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardTitleMuted}>
                  FORMA DE PAGAMENTO
                </span>
              </div>
              {discountStock.payment.paidLabel ? (
                <span className={styles.paidPill}>
                  {discountStock.payment.paidLabel}
                </span>
              ) : null}
            </div>

            <div className={styles.paymentBlock}>
              <div className={styles.paymentMethod}>{discountStock.payment.method}</div>
              {discountStock.payment.details ? (
                <div className={styles.paymentDetails}>
                  {discountStock.payment.details}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardTitleMuted}>
                  HISTORICO DA BAIXA
                </span>
              </div>
            </div>

            <div className={styles.timeline}>
              {discountStock.history.map((h, idx) => {
                const isLast = idx === discountStock.history.length - 1;
                return (
                  <div key={`${h.label}-${idx}`} className={styles.timelineRow}>
                    <div className={styles.tlLeft}>
                      <div
                        className={`${styles.tlDot} ${
                          h.status === "done"
                            ? styles.tlDotDone
                            : h.status === "current"
                              ? styles.tlDotCurrent
                              : styles.tlDotPending
                        }`}
                      />
                      {!isLast ? (
                        <div
                          className={`${styles.tlLine} ${
                            h.status === "done"
                              ? styles.tlLineDone
                              : styles.tlLinePending
                          }`}
                        />
                      ) : null}
                    </div>

                    <div className={styles.tlContent}>
                      <div
                        className={`${styles.tlLabel} ${
                          h.status === "pending" ? styles.tlLabelPending : ""
                        }`}
                      >
                        {h.label}
                      </div>
                      {h.timeLabel ? (
                        <div className={styles.tlTime}>{h.timeLabel}</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
