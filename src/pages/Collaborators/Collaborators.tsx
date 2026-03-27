import { useEffect, useState, useRef } from "react";
import { Trash, UserPlus } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import styles from "./Collaborators.module.css";
import { CompanyService } from "../../service/Company.service";
import { toast } from "react-toastify";
import {
  UserService,
  type UserProfileResponse,
} from "../../service/User.service";
import { UserTypeEnum } from "../../dtos/enums/user-type.enum";

export function Collaborators() {
  //
  const { user } = useAuth();
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
  //
  //

  //new user
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userType, setUserType] = useState<keyof typeof UserTypeEnum | "">("");
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  //
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
      //
      setCompanyId(data.companyId);
      //
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

  //
  //

  //

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

  const handleCreateUser = async () => {
    if (!companyId) return;
    try {
      const dto = {
        name: userName,
        email: userEmail,
        password: userPassword,
        userType: userType as UserTypeEnum,
        companyId,
      };
      await UserService.create(dto);
      toast.success("Colaborador criado com sucesso!", {
        autoClose: 2000,
      });
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserType("");
    } catch (error) {
      toast.error("Erro ao criar colaborador.");
    }
  };
  //

  //

  // Paginação
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gerenciamento de Colaboradores</h1>
          <p className={styles.subtitle}>
            Controle de acesso e administração da equipe de operações
            enterprise.
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
      <div className={styles.formGrid}>
        <div
          className={styles.formSection}
          style={{ maxWidth: 280, width: "100%" }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 18 }}
          >
            <UserPlus
              size={22}
              style={{ marginRight: 8, color: "var(--highlight-primary)" }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "var(--highlight-primary)",
              }}
            >
              Novo Cadastro
            </span>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome completo</label>
            <input
              type="text"
              name="nomeCompleto"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.input}
              placeholder="Ex: Rodrigo Silva"
              autoComplete="off"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail corporativo</label>
            <input
              type="email"
              name="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={styles.input}
              placeholder="nome@empresa.com"
              autoComplete="off"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Senha temporária</label>
            <input
              type="password"
              name="senha"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className={styles.input}
              placeholder="Senha"
              autoComplete="off"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tipo de colaborador</label>
            <select
              className={styles.input}
              value={userType}
              onChange={(e) =>
                setUserType(e.target.value as keyof typeof UserTypeEnum)
              }
            >
              <option value="" disabled hidden>
                Visualizar opções
              </option>
              <option value="ADMIN">Administrador</option>
              <option value="SELLER">Vendedor</option>
            </select>
          </div>
          <button
            className={styles.saveButton}
            onClick={handleCreateUser}
            disabled={!canNewUser || loading}
            style={{ width: "100%", marginTop: 10 }}
          >
            Cadastrar Colaborador
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "var(--text-primary)",
              }}
            >
              Colaboradores Ativos
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 18,
                }}
              >
                <span role="img" aria-label="search">
                  🔍
                </span>
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 18,
                }}
              >
                <span role="img" aria-label="filter">
                  ☰
                </span>
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", padding: 24 }}
                    >
                      Nenhum colaborador cadastrado.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--highlight-secondary, #eaf2ff)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              color: "var(--highlight-primary)",
                              fontSize: 15,
                              textTransform: "uppercase",
                            }}
                          >
                            {u.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background:
                              u.userType === "ADMIN"
                                ? "rgba(51, 102, 255, 0.12)"
                                : u.userType === "SELLER"
                                  ? "rgba(0, 184, 163, 0.12)"
                                  : u.userType === "EDITOR"
                                    ? "rgba(255, 184, 0, 0.12)"
                                    : "rgba(120, 120, 120, 0.12)",
                            color:
                              u.userType === "ADMIN"
                                ? "#3366ff"
                                : u.userType === "SELLER"
                                  ? "#00b8a3"
                                  : u.userType === "EDITOR"
                                    ? "#ffb800"
                                    : "#888",
                          }}
                        >
                          {u.userType === "ADMIN"
                            ? "ADMINISTRADOR"
                            : u.userType === "SELLER"
                              ? "VENDEDOR"
                              : u.userType === "EDITOR"
                                ? "EDITOR"
                                : "VISUALIZADOR"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.actionButton}
                          style={{ marginRight: 6 }}
                        >
                          <Trash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Exibindo {paginatedUsers.length} de {users.length} colaboradores
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background:
                    currentPage === 1 ? "#e5e7eb" : "var(--highlight-primary)",
                  color: currentPage === 1 ? "#aaa" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontWeight: 600,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                &lt;
              </button>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                style={{
                  background:
                    currentPage === totalPages
                      ? "#e5e7eb"
                      : "var(--highlight-primary)",
                  color: currentPage === totalPages ? "#aaa" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontWeight: 600,
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                &gt;
              </button>
            </div>
          </div>
          <div
            className={styles.hint}
            style={{
              marginTop: 18,
              background: "rgba(51,102,255,0.07)",
              borderLeft: "3px solid #3366ff",
            }}
          >
            <strong style={{ color: "#3366ff" }}>
              Insight do Administrador
            </strong>
            <br />
            Você pode revisar pedidos de acesso pendentes na fila de aprovação.
            Reveja as permissões de "Visualizador" para "Editor" na tela de
            Analytics.
          </div>
        </div>
      </div>
    </main>
  );
}
