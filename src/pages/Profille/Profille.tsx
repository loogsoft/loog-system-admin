import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import styles from "./Profille.module.css";
import { CompanyService } from "../../service/Company.service";
import { toast } from "react-toastify";
import {
  UserService,
  type UserProfileResponse,
} from "../../service/User.service";
import { UserTypeEnum } from "../../dtos/enums/user-type.enum";
export function Profille() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: user?.name || "Alex Johnson",
    email: user?.email || "alex.johnson@pinna.com",
    cpf: "000.000.000-00",
    telefone: "(11) 99999-9999",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nomeCompleto: user?.name || "Alex Johnson",
      email: user?.email || "alex.johnson@pinna.com",
    }));
  }, [user]);

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState<any>("");
  const [companyCpfCnpj, setCompanyCpfCnpj] = useState<any>("");
  const [companyColor, setCompanyColor] = useState("");
  const [memberDate, setMenberDate] = useState("");
  const [userStatus, setUserStatus] = useState<UserTypeEnum | null>(null);

  //new user
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userType, setUserType] = useState<keyof typeof UserTypeEnum | "">("");

  const [users, setUsers] = useState<UserProfileResponse[]>([]);

  const status =
    userStatus === "ADMIN"
      ? "Administrador"
      : userStatus === "SELLER"
        ? "Vendedor"
        : "Usuário";
  const originalData = useRef({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyCpfCnpj: "",
    companyColor: "",
  });
  const originalPersonalData = useRef({
    nomeCompleto: user?.name || "Alex Johnson",
    email: user?.email || "alex.johnson@pinna.com",
    cpf: "000.000.000-00",
    telefone: "(11) 99999-9999",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [canSave, setCanSave] = useState(false);

  const [canNewUser, setCanNewUser] = useState(false);

  useEffect(() => {
    const findUser = async () => {
      const data = await UserService.findOne(user?.id || "");
      setUserStatus(data.userType);
      setCompanyId(data.companyId);
      setMenberDate(
        data.dataCadastro
          ? new Date(data.dataCadastro).toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
              day: "numeric",
            })
          : "",
      );
      const dataa = await UserService.findAll(data.companyId);
      setUsers(dataa);
    };

    findUser();
  }, []);
  useEffect(() => {
    const allFilled =
      userName.trim() !== "" &&
      userEmail.trim() !== "" &&
      userPassword.trim() !== "" &&
      userType !== "";
    setCanNewUser(allFilled);
  }, [userName, userEmail, userPassword, userType]);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        const data = await CompanyService.findOne(companyId);
        setCompanyName(data.companyName);
        setCompanyEmail(data.companyEmail);
        setCompanyPhone(data.companyPhone ? String(data.companyPhone) : "");
        setCompanyCpfCnpj(
          data.companyCpfCnpj ? String(data.companyCpfCnpj) : "",
        );
        setCompanyColor(data.color);

        originalData.current = {
          companyName: data.companyName || "",
          companyEmail: data.companyEmail || "",
          companyPhone: data.companyPhone ? String(data.companyPhone) : "",
          companyCpfCnpj: data.companyCpfCnpj
            ? String(data.companyCpfCnpj)
            : "",
          companyColor: data.color || "",
        };
      } catch (error) {
        console.error("Erro ao buscar dados da empresa:", error);
      }
    };

    fetchData();
  }, [companyId]);
  // 👈 AQUI É O SEGREDO

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setCanSave(isPersonalDataChanged(updated) || isCompanyDataChanged());
      return updated;
    });
  };
  function isPersonalDataChanged(data = formData) {
    const keys = Object.keys(originalPersonalData.current);
    for (const key of keys) {
      if (
        data[key as keyof typeof data] !==
        originalPersonalData.current[
          key as keyof typeof originalPersonalData.current
        ]
      ) {
        return true;
      }
    }
    return false;
  }

  function isCompanyDataChanged(
    cName = companyName,
    cEmail = companyEmail,
    cPhone = companyPhone,
    cCpfCnpj = companyCpfCnpj,
    cColor = companyColor,
  ) {
    return (
      cName !== (originalData.current.companyName ?? "") ||
      cEmail !== (originalData.current.companyEmail ?? "") ||
      cPhone !== (originalData.current.companyPhone ?? undefined) ||
      cCpfCnpj !== (originalData.current.companyCpfCnpj ?? undefined) ||
      cColor !== (originalData.current.companyColor ?? "")
    );
  }

  const handleSave = () => {
    setLoading(true);
    setCanSave(false);
    const fetchData = async () => {
      const dto = {
        companyName,
        companyEmail,
        companyPhone:
          companyPhone && companyPhone.replace(/\D/g, "")
            ? Number(companyPhone.replace(/\D/g, ""))
            : 0,
        companyCpfCnpj:
          companyCpfCnpj && companyCpfCnpj.replace(/\D/g, "")
            ? Number(companyCpfCnpj.replace(/\D/g, ""))
            : 0,
        color: companyColor,
      };
      if (companyId)
        try {
          const userPayload = {
            name: companyName,
          };
          await CompanyService.update(companyId, dto);
          if (user?.id) await UserService.update(user.id, userPayload);
          try {
            const data = await CompanyService.findOne(companyId);
            setCompanyName(data.companyName);
            setCompanyEmail(data.companyEmail);
            setCompanyPhone(data.companyPhone);
            setCompanyCpfCnpj(data.companyCpfCnpj);
            setCompanyColor(data.color);
            originalData.current = {
              companyName: data.companyName || "",
              companyEmail: data.companyEmail || "",
              companyPhone: data.companyPhone ? String(data.companyPhone) : "",
              companyCpfCnpj: data.companyCpfCnpj
                ? String(data.companyCpfCnpj)
                : "",
              companyColor: data.color || "",
            };
            originalPersonalData.current = {
              ...formData,
            };
            if (data.color) {
              document.documentElement.style.setProperty(
                "--highlight-primary",
                data.color,
              );
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
          } catch (error) {
            setLoading(false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados da empresa:", error);
        } finally {
          toast.success("Configurações da empresa atualizadas com sucesso!", {
            autoClose: 2000,
          });
          setLoading(false);
        }
    };

    fetchData();
  };

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

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações de Perfil</h1>
          <p className={styles.subtitle}>
            Gerencie suas informações pessoais e credenciais de acesso.
          </p>
        </div>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!canSave || loading}
        >
          {loading ? " 💾 Salvando Alterações..." : " 💾 Salvar Alterações"}
        </button>
      </div>

      <div className={styles.profileCard}>
        <div
          className={styles.profileAvatar}
          style={{
            background: "var(--highlight-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            width: 80,
            height: 80,
            fontWeight: 400,
            fontSize: 28,
            color: "#fff",
            border: "4px solid #fff",
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
          }}
        >
          {initials}
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{formData.nomeCompleto}</h2>
          <div className={styles.profileMeta}>
            <span className={styles.badge}>{status}</span>
            <span className={styles.memberDate}>
              Membro desde:{" "}
              <span style={{ color: "#000", fontWeight: "700" }}>
                {" "}
                {memberDate}
              </span>
            </span>
          </div>
          <p className={styles.profileDescription}>
            Responsável pelo gerenciamento geral da plataforma e supervisão de
            relatórios corporativos do Pinha System.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* <div className={styles.formSection}>
          <div className={styles.sectionIcon}>💼</div>
          <h3 className={styles.sectionTitle}>Informações Pessoais</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nome Completo</label>
            <input
              type="text"
              name="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleChange}
              className={styles.input}
              placeholder="Sep seu nome completo"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail Corporativo</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="seu.email@empresa.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>CPF</label>
            <input
              type="text"
              name="cpf"
              value={cpfCnpjMask(formData.cpf)}
              onChange={handleChange}
              className={styles.input}
              placeholder="000.000.000-00"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={phoneMask(formData.telefone)}
              onChange={handleChange}
              className={styles.input}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div> */}
        <div className={styles.formSection}>
          <div className={styles.sectionIcon}>💼</div>
          <h3 className={styles.sectionTitle}>Informações da Empresa</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nome da Empresa</label>
            <input
              type="text"
              name="nomeCompleto"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setCanSave(
                  isPersonalDataChanged() ||
                    isCompanyDataChanged(
                      e.target.value,
                      companyEmail,
                      companyPhone,
                      companyCpfCnpj,
                      companyColor,
                    ),
                );
              }}
              className={styles.input}
              placeholder="Nome da empresa"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail da Empresa</label>
            <input
              type="email"
              name="email"
              value={companyEmail}
              className={styles.input}
              placeholder="seu.email@empresa.com"
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>CPF/CNPJ da Empresa</label>
            <input
              type="text"
              name="cpf"
              value={cpfCnpjMask(companyCpfCnpj)}
              onChange={(e) => {
                setCompanyCpfCnpj(e.target.value);
                setCanSave(
                  isPersonalDataChanged() ||
                    isCompanyDataChanged(
                      companyName,
                      companyEmail,
                      companyPhone,
                      e.target.value,
                      companyColor,
                    ),
                );
              }}
              className={styles.input}
              placeholder="000.000.000-00"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telefone da Empresa</label>
            <input
              type="tel"
              name="telefone"
              value={phoneMask(companyPhone)}
              onChange={(e) => {
                setCompanyPhone(e.target.value);
                setCanSave(
                  isPersonalDataChanged() ||
                    isCompanyDataChanged(
                      companyName,
                      companyEmail,
                      e.target.value,
                      companyCpfCnpj,
                      companyColor,
                    ),
                );
              }}
              className={styles.input}
              placeholder="(11) 99999-9999"
            />
          </div>
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
                value={companyColor}
                onChange={(e) => {
                  setCompanyColor(e.target.value);
                  setCanSave(
                    isPersonalDataChanged() ||
                      isCompanyDataChanged(
                        companyName,
                        companyEmail,
                        companyPhone,
                        companyCpfCnpj,
                        e.target.value,
                      ),
                  );
                }}
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  border: "none",
                  background: "none",
                }}
              />
              <input
                className={styles.inputt}
                type="text"
                value={companyColor}
                onChange={(e) => {
                  setCompanyColor(e.target.value);
                  setCanSave(
                    isPersonalDataChanged() ||
                      isCompanyDataChanged(
                        companyName,
                        companyEmail,
                        companyPhone,
                        companyCpfCnpj,
                        e.target.value,
                      ),
                  );
                }}
                style={{
                  marginLeft: 12,
                  fontSize: 13,
                  width: 90,
                  borderColor: "transparent",
                }}
                maxLength={9}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionIcon}>🔒</div>
          <h3 className={styles.sectionTitle}>Alterar senha de segurança</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Senha Atual</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="senhaAtual"
                value={formData.senhaAtual}
                onChange={handleChange}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nova Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showNewPassword ? "text" : "password"}
                name="novaSenha"
                value={formData.novaSenha}
                onChange={handleChange}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirmar Nova Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.hint}>
            <strong>Dica:</strong> Use pelo menos 8 caracteres, incluindo
            números e símbolos para uma conta mais segura
          </div>
        </div>
      </div>
    </main>
  );
}
