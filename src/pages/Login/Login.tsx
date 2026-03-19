function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Login.module.css";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { UserService } from "../../service/User.service";
import logoLight from "../../assets/logo-preta.png";
import logoDark from "../../assets/logo-preta.png";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { HealthService } from "../../service/health.service";
import { useTheme } from "../../contexts/useTheme";
import { ChevronLeft, Moon, Sun, Headset } from "lucide-react";
import { IoStorefront } from "react-icons/io5";
import { CompanyService } from "../../service/Company.service";
import { UserTypeEnum } from "../../dtos/enums/user-type.enum";
import type { CompanyResponseDto } from "../../dtos/response/company-response.dto";

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const requestFailureMessage =
    "Erro ao processar sua solicitacao. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.";
  const supportPhone = "64999663524";
  const supportMessage =
    "Ola! Aqui e do Gerenciamento de Estoque LOOG SYSTEM. Estou com um problema ao acessar o painel, podem me ajudar?";
  const supportUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(
    supportMessage,
  )}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [email, setEmail] = useState("admin.giuseppevidal@gmail.com");
  // const [password, setPassword] = useState("giuseppe.vidal@");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<
    | "login"
    | "verify"
    | "newCommunity"
    | "newCommunity2"
    | "newCommunity3"
    | "newCommunity4"
  >("login");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
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
  const [color, setColor] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [companyId, setCompanyId] = useState("");

  // async function newCompany() {
  //   const payloadCompany = {
  //     companyName,
  //     companyEmail,
  //     companyPhone: Number(companyPhone.replace(/\D/g, "")),
  //     companyCpfCnpj: Number(companyCpfCnpj.replace(/\D/g, "")),
  //     color,
  //     // imageUrl: logoPreview || "",
  //   };
  //   try {
  //     const response = await CompanyService.create(payloadCompany);
  //     setCompanyId(response.id);
  //     setStep("login");
  //   } catch (error) {}
  // }

  // async function newUser() {
  //   const payloadUser = {
  //     name: companyName,
  //     email: companyEmail,
  //     userType: UserTypeEnum.ADMIN,
  //     password: companyPassword,
  //     companyId: companyId,
  //   };
  //   await UserService.create(payloadUser);
  // }
  async function handleCreateCompanyAndUser() {
    setLoading(true);
    try {
      const payloadCompany = {
        companyName,
        companyEmail,
        companyPhone: Number(companyPhone.replace(/\D/g, "")),
        companyCpfCnpj: Number(companyCpfCnpj.replace(/\D/g, "")),
        color,
        // imageUrl: logoPreview || "",
      };
      const response = await CompanyService.create(payloadCompany);
      const createdCompanyId = response.id;
      if (!createdCompanyId) {
        // Não faz nada, mantém loading
        return;
      }
      setCompanyId(createdCompanyId);
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
    } catch (error) {
      showErrorToast();
      setLoading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  }

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

  function cpfCnpjMask(value: string): string {
    if (!value) return "";

    // remove tudo que não for número
    value = value.replace(/\D/g, "");

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

  const showErrorToast = useCallback(() => {
    toast.error(
      <span>
        {requestFailureMessage}{" "}
        <a
          className={styles.toastLink}
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
        >
          Falar no WhatsApp
        </a>
      </span>,
    );
  }, [requestFailureMessage, supportUrl]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (step === "login") {
        try {
          setLoading(true);
          const data = await UserService.verifyEmail({ email, password });
          setCompanyId(data.companyId);
          setStep("verify");
        } catch {
          showErrorToast();
        } finally {
          setLoading(false);
        }
        return;
      }

      if (step === "verify") {
        try {
          setLoading(true);
          const verify = await UserService.verificationToken({
            email,
            code: code.join(""),
          });
          localStorage.setItem("token", verify.token);
          contextLogin(verify.token);
          navigate("/dashboard");
          try {
            const data: CompanyResponseDto =
              await CompanyService.findOne(companyId);
            if (data.color) {
              document.documentElement.style.setProperty(
                "--highlight-primary",
                data.color,
              );
              const companyData = localStorage.getItem("company");
              if (!companyData || companyData !== JSON.stringify(data)) {
                const setCompanyData = localStorage.setItem(
                  "company",
                  JSON.stringify(data),
                );
              }
              // Converter cor hex para rgba com opacidade 0.15
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
                hexToRgba(data.color, 0.15),
              );
            }
          } catch (error) {}
        } catch {
          setCode(["", "", "", "", "", ""]);
          codeRefs.current[0]?.focus();
          showErrorToast();
        } finally {
          setLoading(false);
        }
        return;
      }
      // Para os steps de cadastro, não faz nada no submit
    },
    [code, contextLogin, email, navigate, password, showErrorToast, step],
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
            }}
            aria-label="Voltar"
            data-tooltip="Voltar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className={styles.formWrap}>
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="Logo"
            className={styles.logoImg}
          />

          <div className={styles.header}>
            <div className={styles.h1}>
              {step === "login"
                ? "Bem-vindo"
                : step === "newCommunity"
                  ? "Crie seu sistema"
                  : step === "newCommunity2"
                    ? "Personalize seu painel"
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
                    ? "Adicione cor de destaque dos botões."
                    : step === "newCommunity3"
                      ? "Adicione a logo do seu sistema."
                      : step === "newCommunity4"
                        ? "Crie seu acesso administrativo para começar a usar o sistema."
                        : "Acesse sua conta para gerenciar seu negócio. "}
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {step === "login" ? (
              <>
                <label className={styles.label}>E-mail</label>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@pinha.com.br"
                    type="email"
                    autoComplete="email"
                  />
                </div>

                <label className={styles.label} style={{ marginTop: 24 }}>
                  Senha
                </label>

                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
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
                      color: "#2563eb",
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
                  Enviamos um código de 6 dígitos para o seu e-mail.
                </div>
                <div className={styles.codeRow}>
                  {code.map((digit, index) => (
                    <input
                      key={`code-${index}`}
                      className={styles.codeInput}
                      value={digit}
                      ref={(el) => {
                        codeRefs.current[index] = el;
                      }}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={handleCodePaste}
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`Código ${index + 1}`}
                    />
                  ))}
                </div>
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
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={phoneMask(companyPhone)}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>

                <label className={styles.label}>CPF/CNPJ da empresa</label>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    value={cpfCnpjMask(companyCpfCnpj)}
                    onChange={(e) => setCompanyCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00 / 00.000.000/0000-00"
                    type="text"
                    autoComplete="off"
                  />
                </div>

                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity2")}
                  disabled={
                    !companyName.trim() ||
                    !companyEmail.trim() ||
                    !isValidEmail(companyEmail) ||
                    !companyPhone.trim() ||
                    !companyCpfCnpj.trim()
                  }
                  style={{
                    opacity:
                      !companyName.trim() ||
                      !companyEmail.trim() ||
                      !isValidEmail(companyEmail) ||
                      !companyPhone.trim() ||
                      !companyCpfCnpj.trim()
                        ? 0.6
                        : 1,
                    pointerEvents:
                      !companyName.trim() ||
                      !companyEmail.trim() ||
                      !isValidEmail(companyEmail) ||
                      !companyPhone.trim() ||
                      !companyCpfCnpj.trim()
                        ? "none"
                        : "auto",
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
                {/* Mini preview do sistema com a cor escolhida */}
                <div
                  style={{
                    width: 220,
                    margin: "0 auto 18px auto",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    background: "#fff",
                    border: "1px solid #eee",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 18,
                      background: "#f5f5f5",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      width: "80%",
                      height: 12,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      width: "100%",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 32,
                        background: color || "var(--highlight-primary)",
                        borderRadius: 8,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Botão
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 32,
                        background: "#f3f4f6",
                        borderRadius: 8,
                        color: "#222",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1.5px solid ${color || "var(--highlight-primary)"}`,
                      }}
                    >
                      Secundário
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "#e5e7eb",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      width: "60%",
                      height: 8,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      marginTop: 4,
                    }}
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
                      value={color || "var(--highlight-primary)"}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        border: "none",
                        background: "none",
                      }}
                    />
                    <span style={{ marginLeft: 12, fontSize: 13 }}>
                      {color || "var(--highlight-primary)"}
                    </span>
                  </div>
                </div>

                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity3")}
                  disabled={!color.trim()}
                  style={{
                    opacity: !color.trim() ? 0.6 : 1,
                    pointerEvents: !color.trim() ? "none" : "auto",
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
                {/* Mini preview do sistema com a logo */}
                <div
                  style={{
                    width: 200,
                    height: 200,
                    margin: "0 auto 18px auto",
                    borderRadius: 999,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    background: "#fff",
                    border: "1px solid #eee",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
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
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  <div
                    style={{
                      border: "1.5px dashed #cbd5e1",
                      borderRadius: 14,
                      background: "#f8fafc",
                      minHeight: 90,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 12,
                      gap: 2,
                    }}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <span style={{ color: "#64748b", fontSize: 14 }}>
                      Clique para adicionar logo
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>
                      PNG, JPG ou SVG (máx. 2MB)
                    </span>
                  </div>
                </div>

                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => setStep("newCommunity4")}
                  disabled={
                    !companyName.trim() ||
                    !companyEmail.trim() ||
                    !isValidEmail(companyEmail) ||
                    !companyPhone.trim() ||
                    !companyCpfCnpj.trim()
                  }
                  style={{
                    opacity:
                      !companyName.trim() ||
                      !companyEmail.trim() ||
                      !isValidEmail(companyEmail) ||
                      !companyPhone.trim() ||
                      !companyCpfCnpj.trim()
                        ? 0.6
                        : 1,
                    pointerEvents:
                      !companyName.trim() ||
                      !companyEmail.trim() ||
                      !isValidEmail(companyEmail) ||
                      !companyPhone.trim() ||
                      !companyCpfCnpj.trim()
                        ? "none"
                        : "auto",
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
                    disabled={
                      !companyPassword.trim() ||
                      !confirmPassword.trim() ||
                      companyPassword !== confirmPassword ||
                      companyPassword.length < 8
                    }
                    style={{
                      opacity:
                        !companyPassword.trim() ||
                        !confirmPassword.trim() ||
                        companyPassword !== confirmPassword ||
                        companyPassword.length < 8
                          ? 0.6
                          : 1,
                      pointerEvents:
                        !companyPassword.trim() ||
                        !confirmPassword.trim() ||
                        companyPassword !== confirmPassword ||
                        companyPassword.length < 8
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
