function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(value: string) {
  return onlyDigits(value).slice(0, 11);
}

function normalizeCpfCnpj(value: string) {
  return onlyDigits(value).slice(0, 14);
}

function isValidPhone(value: string) {
  return /^\d{10,11}$/.test(onlyDigits(value));
}

function isValidCpfCnpj(value: string) {
  return /^(\d{11}|\d{14})$/.test(onlyDigits(value));
}

function isValidHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Login.module.css";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { UserService } from "../../service/User.service";
import logo from "../../assets/logo-preta.png";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import axios from "axios";
import { HealthService } from "../../service/health.service";
import { useTheme } from "../../contexts/useTheme";
import DashboardPreview from "../../components/DashboardPreview/DashboardPreview";
import {
  AlertCircle,
  ChevronLeft,
  Headset,
  Lock,
  MessageCircle,
  Moon,
  QrCode,
  Sun,
  WifiOff,
  X,
} from "lucide-react";
import { IoStorefront } from "react-icons/io5";
import { CompanyService } from "../../service/Company.service";
import { UserTypeEnum } from "../../dtos/enums/user-type.enum";
import type { CompanyResponseDto } from "../../dtos/response/company-response.dto";

const SUPPORT_PHONE = "64999999687";
const SUPPORT_MESSAGE =
  "Olá! Aqui é do Gerenciamento de Estoque LOOG SYSTEM. Estou com um problema ao acessar o painel, podem me ajudar?";
const SUPPORT_URL = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(
  SUPPORT_MESSAGE,
)}`;

type PaymentBlockModal = {
  dueDate: string;
};

function getApiBody(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;

  if (!responseData || typeof responseData !== "object") {
    return null;
  }

  const message = (responseData as { message?: unknown }).message;

  if (message && typeof message === "object" && !Array.isArray(message)) {
    return message as Record<string, unknown>;
  }

  return responseData as Record<string, unknown>;
}

function getApiMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "";
  }

  const responseData = error.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  const responseBody = getApiBody(error);

  if (responseBody) {
    const message = responseBody.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.filter(Boolean).join(" ");
    }
  }

  return "";
}

function getPaymentBlockPayload(error: unknown) {
  const responseBody = getApiBody(error);

  if (!responseBody) {
    return {
      companyId: "",
      paymentDueDay: undefined,
    };
  }

  const companyId = responseBody.companyId;

  return {
    companyId:
      typeof companyId === "string" || typeof companyId === "number"
        ? String(companyId)
        : "",
    paymentDueDay: responseBody.paymentDueDay,
  };
}

function isPaymentBlockedMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("pagamento") || normalized.includes("bloqueado");
}

function formatPaymentDueDate(dueDateValue: unknown, fallbackMessage = "") {
  const dueDateText =
    typeof dueDateValue === "string"
      ? dueDateValue
      : dueDateValue instanceof Date
        ? dueDateValue.toISOString()
        : fallbackMessage.match(/vencimento:\s*(.+)$/i)?.[1]?.trim();

  if (!dueDateText) {
    return "Vencimento não informado";
  }

  const dueDate = new Date(dueDateText);

  if (Number.isNaN(dueDate.getTime())) {
    return dueDateText;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dueDate);
}

function createPaymentBlockModal(
  message: string,
  payload: ReturnType<typeof getPaymentBlockPayload>,
): PaymentBlockModal {
  return {
    dueDate: formatPaymentDueDate(payload.paymentDueDay, message),
  };
}

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const supportUrl = SUPPORT_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<
    | "login"
    | "verify"
    | "newCommunity"
    | "newCommunity2" // agora: logo
    | "newCommunity3" // agora: cor
    | "newCommunity4"
  >("login");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [paymentBlock, setPaymentBlock] = useState<PaymentBlockModal | null>(
    null,
  );
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const paymentButtonText = paymentOpened ? "Abrir pagamento" : "Pagar";
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  //dados new company
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyCpfCnpj, setCompanyCpfCnpj] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  //Personalize
  const [color, setColor] = useState("#ff9800");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [companyId, setCompanyId] = useState("");
  const companyIdRef = useRef("");
  const companyPhoneDigits = normalizePhone(companyPhone);
  const companyCpfCnpjDigits = normalizeCpfCnpj(companyCpfCnpj);
  const companyPhoneIsValid = isValidPhone(companyPhoneDigits);
  const companyCpfCnpjIsValid = isValidCpfCnpj(companyCpfCnpjDigits);
  const companyInfoIsValid =
    companyName.trim().length > 0 &&
    companyEmail.trim().length > 0 &&
    isValidEmail(companyEmail) &&
    companyPhoneIsValid &&
    companyCpfCnpjIsValid;
  const companyColorIsValid = isValidHexColor(color);
  const companyPasswordIsValid =
    companyPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    companyPassword === confirmPassword &&
    companyPassword.length >= 8;

  async function handleCreateCompanyAndUser() {
    if (!companyInfoIsValid || !companyColorIsValid || !companyPasswordIsValid) {
      toast.error("Revise os dados da empresa antes de finalizar o cadastro.");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = logoFile
        ? await CompanyService.uploadLogo(logoFile)
        : undefined;
      const payloadCompany = {
        companyName,
        companyEmail,
        companyPhone: companyPhoneDigits,
        companyCpfCnpj: companyCpfCnpjDigits,
        color,
        imageUrl,
      };
      const response = await CompanyService.create(payloadCompany);
      const createdCompanyId = response.id;
      if (!createdCompanyId) {
        // Não faz nada, mantém loading
        return;
      }
      setCompanyId(createdCompanyId);
      localStorage.setItem("companyId", String(createdCompanyId));
      const payloadUser = {
        name: companyName,
        email: companyEmail,
        userType: UserTypeEnum.ADMIN,
        password: companyPassword,
        companyId: String(createdCompanyId),
      };
      await UserService.create(payloadUser);
      setStep("login");
      setLoading(false);
    } catch {
      showErrorToast();
      setLoading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      const supportedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
      if (!supportedTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
        toast.error("Selecione uma imagem PNG, JPG ou SVG de até 2MB.");
        e.target.value = "";
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  }

  function phoneMask(value: string): string {
    if (!value) return "";

    // remove tudo que não for número
    value = onlyDigits(value);

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

  function cpfCnpjMask(value: string): string {
    if (!value) return "";

    // remove tudo que não for número
    value = onlyDigits(value);

    // limita a 14 dígitos (CNPJ)
    value = value.slice(0, 14);

    if (value.length <= 11) {
      // CPF: 000.000.000-00
      return value
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    } else {
      // CNPJ: 00.000.000/0000-00
      return value
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const resetPaymentModal = useCallback(() => {
    setPaymentBlock(null);
    setPaymentOpened(false);
    setPaymentMessage(null);
  }, []);

  async function handlePayment() {
    if (paymentLoading || paymentChecking) {
      return;
    }

    // Abre no clique para evitar bloqueio de pop-up após a requisição.
    const paymentWindow = window.open("about:blank", "_blank");

    if (!paymentWindow) {
      toast.error("Permita a abertura de uma nova aba para acessar o pagamento.");
      return;
    }

    paymentWindow.opener = null;
    setPaymentLoading(true);

    try {
      const { paymentUrl } = await UserService.buscarLinkPagamento({
        email,
        password,
      });

      paymentWindow.location.replace(paymentUrl);
      setPaymentOpened(true);
      setPaymentMessage(null);
    } catch (error) {
      paymentWindow.close();
      toast.error(
        getApiMessage(error) ||
          "Não foi possível buscar o link de pagamento. Tente novamente.",
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleCheckPayment() {
    if (!paymentOpened || paymentChecking || paymentLoading) {
      return;
    }

    setPaymentChecking(true);
    setPaymentMessage(null);

    try {
      const data = await UserService.verifyEmail({ email, password });
      setCompanyId(data.companyId);
      companyIdRef.current = data.companyId;
      localStorage.setItem("companyId", String(data.companyId));
      setCode(["", "", "", "", "", ""]);
      setCodeError(null);
      setLoginError(null);
      resetPaymentModal();
      setStep("verify");
    } catch (error) {
      const apiMessage = getApiMessage(error);

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        isPaymentBlockedMessage(apiMessage)
      ) {
        setPaymentMessage(
          "O pagamento ainda não foi confirmado. Aguarde e clique em verificar acesso novamente.",
        );
      } else {
        setPaymentMessage(
          apiMessage ||
            "Não foi possível verificar o acesso. Tente novamente.",
        );
      }
    } finally {
      setPaymentChecking(false);
    }
  }

  const showErrorToast = useCallback(() => {
    toast.error(
      <div className={styles.connectionToastContent}>
        <span className={styles.connectionToastIcon} aria-hidden>
          <WifiOff size={20} />
        </span>
        <div className={styles.connectionToastText}>
          <strong>Não foi possível conectar</strong>
          <span>
            Verifique sua internet e tente novamente. Se o problema continuar,
            fale com o suporte.
          </span>
        </div>
        <a
          className={styles.connectionToastAction}
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} />
          Suporte
        </a>
      </div>,
      {
        className: styles.connectionToast,
        progressClassName: styles.connectionToastProgress,
        icon: false,
        position: "top-right",
        autoClose: 6500,
      },
    );
  }, [supportUrl]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (step === "login") {
        if (!email.trim() || !password) {
          setLoginError("Preencha o e-mail e a senha para continuar.");
          return;
        }

        try {
          setLoading(true);
          setLoginError(null);
          resetPaymentModal();
          const data = await UserService.verifyEmail({ email, password });
          setCompanyId(data.companyId);
          companyIdRef.current = data.companyId;
          localStorage.setItem("companyId", String(data.companyId));
          setStep("verify");
        } catch (error) {
          const apiMessage = getApiMessage(error);
          const paymentPayload = getPaymentBlockPayload(error);

          if (
            axios.isAxiosError(error) &&
            error.response?.status === 403 &&
            isPaymentBlockedMessage(apiMessage)
          ) {
            setLoginError(null);
            if (paymentPayload.companyId) {
              setCompanyId(paymentPayload.companyId);
              companyIdRef.current = paymentPayload.companyId;
              localStorage.setItem("companyId", paymentPayload.companyId);
            }
            setPaymentBlock(createPaymentBlockModal(apiMessage, paymentPayload));
          } else if (
            axios.isAxiosError(error) &&
            error.response?.status === 401
          ) {
            setLoginError(
              "E-mail ou senha incorretos. Confira os dados e tente novamente.",
            );
          } else if (
            axios.isAxiosError(error) &&
            (!error.response || error.response.status >= 500)
          ) {
            showErrorToast();
          } else {
            setLoginError(
              "Não foi possível validar seus dados. Revise as informações e tente novamente.",
            );
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      if (step === "verify") {
        if (code.some((digit) => !digit)) {
          setCodeError("Informe o código de 6 dígitos para continuar.");
          codeRefs.current[code.findIndex((digit) => !digit)]?.focus();
          return;
        }

        try {
          setLoading(true);
          setCodeError(null);
          const verify = await UserService.verificationToken({
            email,
            code: code.join(""),
          });
          localStorage.setItem("token", verify.token);

          // Buscar dados do usuário para pegar o userType
          let userType: UserTypeEnum | undefined;
          let userCompanyId: string | undefined = undefined;
          try {
            const userData = await UserService.getMe();
            if (userData && userData.id) {
              const userProfile = await UserService.findOne(userData.id);
              userType = userProfile.userType;
              userCompanyId = userProfile.companyId;
              if (userCompanyId) {
                localStorage.setItem("companyId", String(userCompanyId));
              }
              if (userType) localStorage.setItem("userType", userType);
            }
          } catch {
            // O token continua válido mesmo se o perfil completo não carregar.
          }

          setTimeout(() => {
            contextLogin(verify.token);
            navigate("/dashboard");
          }, 1500);

          try {
            const idToUse = companyIdRef.current || companyId || userCompanyId;
            if (idToUse) {
              localStorage.setItem("companyId", String(idToUse));
              const data: CompanyResponseDto =
                await CompanyService.findOne(idToUse);
              if (data.color) {
                document.documentElement.style.setProperty(
                  "--highlight-primary",
                  data.color,
                );
              }
              const companyData = localStorage.getItem("company");
              if (!companyData || companyData !== JSON.stringify(data)) {
                localStorage.setItem("company", JSON.stringify(data));
              }
              function hexToRgba(hex: string, alpha: number) {
                let c = hex.replace("#", "");
                if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
                const num = parseInt(c, 16);
                const r = (num >> 16) & 255;
                const g = (num >> 8) & 255;
                const b = num & 255;
                return `rgba(${r},${g},${b},${alpha})`;
              }
              document.documentElement.style.setProperty(
                "--highlight-secondary",
                hexToRgba(data.color, 0.1),
              );
            }
          } catch {
            // A personalização visual é opcional e não bloqueia o login.
          }
        } catch (error) {
          setCode(["", "", "", "", "", ""]);
          codeRefs.current[0]?.focus();

          if (axios.isAxiosError(error) && error.response?.status === 401) {
            setCodeError(
              "Código inválido ou expirado. Confira o código enviado e tente novamente.",
            );
          } else if (
            axios.isAxiosError(error) &&
            (!error.response || error.response.status >= 500)
          ) {
            showErrorToast();
          } else {
            setCodeError("Não foi possível validar o código. Tente novamente.");
          }
        } finally {
          setTimeout(() => {
            setLoading(false);
          }, 1500);
        }
        return;
      }
      // Para os steps de cadastro, não faz nada no submit
    },
    [
      code,
      contextLogin,
      email,
      navigate,
      password,
      resetPaymentModal,
      showErrorToast,
      step,
      companyId,
    ],
  );

  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        codeRefs.current[0]?.focus();
      }, 0);
    }
  }, [step]);

  useEffect(() => {
    HealthService.health();
  }, []);

  const handleResendCode = useCallback(async () => {
    if (loading || resendCooldown > 0) {
      return;
    }
    try {
      setLoading(true);
      await UserService.verifyEmail({ email, password });
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      setCodeError(null);
      codeRefs.current[0]?.focus();
    } catch {
      showErrorToast();
    } finally {
      setLoading(false);
    }
  }, [email, loading, password, resendCooldown, showErrorToast]);

  function handleCodeChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = nextValue;
    setCode(next);
    setCodeError(null);
    if (nextValue && index < code.length - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    setCodeError(null);
    const focusIndex = Math.min(pasted.length, 5);
    codeRefs.current[focusIndex]?.focus();
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageTopBar}>
        <a
          className={styles.topBtn}
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar com suporte"
          data-tooltip="Suporte"
        >
          <Headset size={18} />
        </a>
        <button
          type="button"
          className={styles.topBtn}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          data-tooltip={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {paymentBlock && (
        <div className={styles.paymentOverlay}>
          <div
            className={styles.paymentModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <button
              type="button"
              className={styles.paymentClose}
              onClick={resetPaymentModal}
              aria-label="Fechar aviso de pagamento"
              disabled={paymentLoading || paymentChecking}
            >
              <X size={18} />
            </button>

            <div className={styles.paymentHero}>
              <span className={styles.paymentHeroIcon}>
                <Lock size={22} />
              </span>
              <div className={styles.paymentHeroText}>
                <span>Acesso bloqueado</span>
                <h2 id="payment-modal-title">
                  {paymentOpened ? "Aguardando confirmação" : "Pagamento pendente"}
                </h2>
              </div>
            </div>

            <p className={styles.paymentDescription}>
              Seu painel está temporariamente pausado. Para regularizar o acesso,
              realize o pagamento pelo Asaas.
            </p>

            <div className={styles.paymentDueCard}>
              <span>Vencimento informado</span>
              <strong>{paymentBlock.dueDate}</strong>
            </div>

            <div className={styles.paymentNoticeInfo}>
              <span>Pagamento</span>
              <strong>R$ 150,00</strong>
              <p role="status" aria-live="polite">
                {paymentMessage ||
                  (paymentOpened
                    ? "Após concluir o pagamento no Asaas, clique em Já paguei para verificar seu acesso."
                    : "Ao clicar em pagar, a página do Asaas abrirá em uma nova aba.")}
              </p>
            </div>

            <div className={styles.paymentActions}>
              {paymentOpened && (
                <button
                  type="button"
                  className={`${styles.paymentPrimary} ${styles.paymentCheck}`}
                  onClick={handleCheckPayment}
                  disabled={paymentLoading || paymentChecking}
                  aria-busy={paymentChecking}
                >
                  {paymentChecking && (
                    <CircularProgress size={17} color="inherit" />
                  )}
                  {paymentChecking
                    ? "Verificando acesso..."
                    : "Já paguei, verificar acesso"}
                </button>
              )}
              <button
                type="button"
                className={
                  paymentOpened ? styles.paymentSecondary : styles.paymentPrimary
                }
                onClick={handlePayment}
                disabled={paymentLoading || paymentChecking}
                aria-busy={paymentLoading}
              >
                {paymentLoading ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <QrCode size={17} />
                )}
                {paymentLoading ? "Buscando link..." : paymentButtonText}
              </button>
              <button
                type="button"
                className={styles.paymentSecondary}
                onClick={resetPaymentModal}
                disabled={paymentLoading || paymentChecking}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        {step !== "login" && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              if (step === "verify") setStep("login");
              else if (step === "newCommunity") setStep("login");
              else if (step === "newCommunity2") setStep("newCommunity");
              else if (step === "newCommunity3") setStep("newCommunity2");
              else if (step === "newCommunity4") setStep("newCommunity3");
            }}
            aria-label="Voltar"
            data-tooltip="Voltar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className={styles.formWrap}>
          <div className={styles.brandMark} aria-label="Loog System">
            <img src={logo} alt="" className={styles.logoImg} />
            <span className={styles.brandName}>
              <span>Loog</span>
              <span className={styles.brandNameAccent}>System</span>
            </span>
          </div>

          <div className={styles.header}>
            <div className={styles.h1}>
              {step === "login"
                ? "Bem-vindo"
                : step === "newCommunity"
                  ? "Crie seu sistema"
                  : step === "newCommunity2"
                    ? "Adicione a logo"
                    : step === "newCommunity3"
                      ? "Personalize seu painel"
                      : step === "newCommunity4"
                        ? "Crie seu acesso"
                        : "Bem-vindo"}
            </div>
            <div className={styles.sub}>
              {step === "login"
                ? "     Acesse sua conta para gerenciar seu negócio."
                : step === "newCommunity"
                  ? "Crie seu sistema de gerenciamento em poucos passos."
                  : step === "newCommunity2"
                    ? "Adicione a logo do seu sistema."
                    : step === "newCommunity3"
                      ? "Adicione cor de destaque dos botões."
                      : step === "newCommunity4"
                        ? "Crie seu acesso administrativo para começar a usar o sistema."
                        : "Acesse sua conta para gerenciar seu negócio. "}
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {step === "login" ? (
              <>
                <label className={styles.label}>E-mail</label>
                <div
                  className={`${styles.inputWrap} ${loginError ? styles.inputWrapError : ""}`}
                >
                  <input
                    className={styles.input}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginError(null);
                      setPaymentBlock(null);
                    }}
                    placeholder="exemplo@pinha.com.br"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(loginError)}
                    aria-describedby={loginError ? "login-error" : undefined}
                  />
                </div>

                <label className={styles.label} style={{ marginTop: 24 }}>
                  Senha
                </label>

                <div
                  className={`${styles.inputWrap} ${loginError ? styles.inputWrapError : ""}`}
                >
                  <input
                    className={styles.input}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError(null);
                      setPaymentBlock(null);
                    }}
                    placeholder="••••••••"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={Boolean(loginError)}
                    aria-describedby={loginError ? "login-error" : undefined}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {loginError && (
                  <div
                    id="login-error"
                    className={styles.loginError}
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle size={17} aria-hidden />
                    <span>{loginError}</span>
                  </div>
                )}

                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Manter conectado por 30 dias</span>
                </label>

                <button className={styles.submit} type="submit">
                  {loading ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                      className={styles.loading}
                    />
                  ) : (
                    <>
                      ENTRAR
                      <span className={styles.submitIcon} aria-hidden>
                        <FiArrowRight />
                      </span>
                    </>
                  )}
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 24,
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  <span>Não possui conta?</span>
                  <span
                    onClick={() => setStep("newCommunity")}
                    style={{
                      color: "var(--status-info)",
                      fontWeight: 600,
                      textDecoration: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      padding: "2px 8px",
                      borderRadius: 6,
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#f1f5fd")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Criar conta!
                  </span>
                </div>
                <div className={styles.copy}>© 2026 LOOG SYSTEM.</div>
              </>
            ) : step === "verify" ? (
              <div className={styles.verifyWrap}>
                <div className={styles.verifyTitle}>
                  Verificacao de Seguranca
                </div>
                <div className={styles.verifySub}>
                  Enviamos um código de 6 dígitos para o seu e-mail
                  <span style={{ color: "var(--highlight-primary-semp)" }}>
                    {" "}
                    loogsystem@gmail.com
                  </span>
                </div>
                <div className={styles.codeRow}>
                  {code.map((digit, index) => (
                    <input
                      key={`code-${index}`}
                      className={`${styles.codeInput} ${codeError ? styles.codeInputError : ""}`}
                      value={digit}
                      ref={(el) => {
                        codeRefs.current[index] = el;
                      }}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={handleCodePaste}
                      inputMode="numeric"
                      maxLength={1}
                      aria-invalid={Boolean(codeError)}
                      aria-describedby={codeError ? "code-error" : undefined}
                      aria-label={`Código ${index + 1}`}
                    />
                  ))}
                </div>
                {codeError && (
                  <div
                    id="code-error"
                    className={styles.loginError}
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle size={17} aria-hidden />
                    <span>{codeError}</span>
                  </div>
                )}
                <div className={styles.verifyNote}>
                  Por favor, insira o código para continuar.
                </div>
                <button className={styles.verifyButton} type="submit">
                  {loading ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                      className={styles.loading}
                    />
                  ) : (
                    "VERIFICAR CÓDIGO"
                  )}
                </button>
                <button
                  type="button"
                  className={styles.resend}
                  onClick={handleResendCode}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : "Reenviar código"}
                </button>
                <div className={styles.helpLink}>
                  Não recebeu o código?{" "}
                  <a
                    className={styles.supportLink}
                    href={supportUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fale com suporte
                  </a>
                </div>
              </div>
            ) : step === "newCommunity" ? (
              <>
                <label className={styles.label}>Nome da empresa</label>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da empresa"
                    type="text"
                    autoComplete="organization"
                  />
                </div>

                <label className={styles.label}>E-mail da empresa</label>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="exemplo@minhaempresa.com.br"
                    type="email"
                    autoComplete="email"
                  />
                </div>

                <label className={styles.label}>Telefone da empresa</label>
                <div
                  className={`${styles.inputWrap} ${
                    companyPhone && !companyPhoneIsValid
                      ? styles.inputWrapError
                      : ""
                  }`}
                >
                  <input
                    className={styles.input}
                    value={phoneMask(companyPhone)}
                    onChange={(e) =>
                      setCompanyPhone(normalizePhone(e.target.value))
                    }
                    placeholder="(11) 98765-4321"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
                {companyPhone && !companyPhoneIsValid && (
                  <span className={styles.fieldError}>
                    Informe DDD + telefone com 10 ou 11 dígitos.
                  </span>
                )}

                <label className={styles.label}>CPF/CNPJ da empresa</label>
                <div
                  className={`${styles.inputWrap} ${
                    companyCpfCnpj && !companyCpfCnpjIsValid
                      ? styles.inputWrapError
                      : ""
                  }`}
                >
                  <input
                    className={styles.input}
                    value={cpfCnpjMask(companyCpfCnpj)}
                    onChange={(e) =>
                      setCompanyCpfCnpj(normalizeCpfCnpj(e.target.value))
                    }
                    placeholder="000.000.000-00 / 00.000.000/0000-00"
                    type="text"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </div>
                {companyCpfCnpj && !companyCpfCnpjIsValid && (
                  <span className={styles.fieldError}>
                    Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.
                  </span>
                )}

                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity2")}
                  disabled={!companyInfoIsValid}
                  style={{
                    opacity: !companyInfoIsValid ? 0.6 : 1,
                    pointerEvents: !companyInfoIsValid ? "none" : "auto",
                  }}
                >
                  Próximo
                  <span className={styles.submitIcon} aria-hidden>
                    <FiArrowRight />
                  </span>
                </button>
              </>
            ) : step === "newCommunity2" ? (
              <>
                <div className={styles.logoPreviewCircle}>
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Pré-visualização"
                      style={{
                        width: "95%",
                        height: "95%",
                        borderRadius: 999,
                        boxShadow: "0 1px 4px #0001",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <IoStorefront size={60} />
                  )}
                </div>

                <label className={styles.label}>Logo do sistema</label>
                <div style={{ width: "100%", marginBottom: 18, marginTop: 15 }}>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  <div
                    className={styles.logoDropZone}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <span className={styles.logoDropTitle}>
                      Clique para adicionar logo
                    </span>
                    <span className={styles.logoDropHint}>
                      PNG, JPG ou SVG (máx. 2MB)
                    </span>
                  </div>
                </div>

                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity3")}
                  disabled={false}
                  style={{
                    opacity: 1,
                    pointerEvents: "auto",
                  }}
                >
                  Próximo
                  <span className={styles.submitIcon} aria-hidden>
                    <FiArrowRight />
                  </span>
                </button>
              </>
            ) : step === "newCommunity3" ? (
              <>
                <div style={{ margin: "0 auto 18px auto", maxWidth: 700 }}>
                  <DashboardPreview
                    name={companyName}
                    color={color}
                    imageUrl={logoPreview || undefined}
                  />
                </div>
                <label className={styles.label}>Cor dos botões</label>
                <div className={styles.inputWrap}>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      className={styles.input}
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        border: "none",
                        background: "none",
                      }}
                    />
                    <input
                      className={styles.input}
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        marginLeft: 12,
                        fontSize: 13,
                        width: 90,
                      }}
                      maxLength={9}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity4")}
                  disabled={!companyColorIsValid}
                  style={{
                    opacity: !companyColorIsValid ? 0.6 : 1,
                    pointerEvents: !companyColorIsValid ? "none" : "auto",
                  }}
                >
                  Próximo
                  <span className={styles.submitIcon} aria-hidden>
                    <FiArrowRight />
                  </span>
                </button>
              </>
            ) : (
              step === "newCommunity4" && (
                <>
                  {/* Mini preview do sistema com a logo */}
                  <div>
                    <label className={styles.label}>E-mail da empresa</label>
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.input}
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="exemplo@minhaempresa.com.br"
                        type="email"
                        autoComplete="email"
                      />
                    </div>
                    {companyEmail && !isValidEmail(companyEmail) && (
                      <span className={styles.fieldError}>
                        Informe um e-mail válido.
                      </span>
                    )}
                    <label className={styles.label} style={{ marginTop: 24 }}>
                      Senha
                    </label>

                    <div className={styles.inputWrap}>
                      <input
                        className={styles.input}
                        value={companyPassword}
                        onChange={(e) => setCompanyPassword(e.target.value)}
                        placeholder="••••••••"
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={
                          showPass ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    <label className={styles.label} style={{ marginTop: 24 }}>
                      Confirmar senha
                    </label>

                    <div className={styles.inputWrap}>
                      <input
                        className={styles.input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={
                          showPass ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <button
                    className={styles.submit}
                    type="button"
                    onClick={handleCreateCompanyAndUser}
                    disabled={!companyInfoIsValid || !companyPasswordIsValid}
                    style={{
                      opacity:
                        !companyInfoIsValid || !companyPasswordIsValid
                          ? 0.6
                          : 1,
                      pointerEvents:
                        !companyInfoIsValid || !companyPasswordIsValid
                          ? "none"
                          : "auto",
                    }}
                  >
                    {loading ? (
                      <CircularProgress
                        size={20}
                        color="inherit"
                        className={styles.loading}
                      />
                    ) : (
                      <>
                        Finalizar
                        <span className={styles.submitIcon} aria-hidden>
                          <FiArrowRight />
                        </span>
                      </>
                    )}
                  </button>
                </>
              )
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
