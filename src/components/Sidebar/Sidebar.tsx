import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiShoppingCart,
  FiBox,
  FiUsers,
  FiSettings,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./Sidebar.module.css";
import { IoExitOutline } from "react-icons/io5";
import { useAuth } from "../../contexts/useAuth";
import { useTheme } from "../../contexts/useTheme";
import logoLight from "../../assets/logo-preta.png";
import logoDark from "../../assets/logo-branco.png";

export function Sidebar() {
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    // 1️⃣ Limpa token e estado
    logout();

    // 2️⃣ Redireciona para login
    navigate("/login");
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  
  // Trunca o email de forma inteligente
  const truncateEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (username && domain) {
      // Se o email é muito longo, exibe "user@dom..." 
      const domainShort = domain.length > 12 ? domain.substring(0, 12) + "..." : domain;
      const emailShort = `${username}@${domainShort}`;
      return emailShort.length > 25 ? emailShort.substring(0, 22) + "..." : emailShort;
    }
    return email.length > 25 ? email.substring(0, 22) + "..." : email;
  };
  
  const displayEmail = truncateEmail(user?.email || "usuario@email.com");
  const initials = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden="true">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Logo"
              style={{ width: 40, height: 40 }}
            />
          </div>
          <div style={{ paddingTop: 10 }}>
            <strong className={styles.brandTitle}>GIUSEPPE</strong>
            <span className={styles.brandSubtitle}>Gestão de Unidade</span>
          </div>
        </div>

        <nav className={styles.menu}>
          <span className={styles.sectionTitle}>Menu principal</span>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiGrid className={styles.icon} />
            <span>Painel</span>
          </NavLink>

          <NavLink
            to="/produtos"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiBox className={styles.icon} />
            <span>Produtos</span>
          </NavLink>

          <NavLink
            to="/discount-stock"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiShoppingCart className={styles.icon} />
            <span>Baixa de estoque</span>
          </NavLink>

          <NavLink
            to="/out-of-stock"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiAlertCircle className={styles.icon} />
            <span>Sem estoque</span>
          </NavLink>

          <NavLink
            to="/suppliers"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiUsers className={styles.icon} />
            <span>Fornecedores</span>
          </NavLink>

          {/* <span className={styles.sectionTitle}>Relatorios</span>
          <button
            type="button"
            className={styles.submenuToggle}
            onClick={() => setReportsOpen((current) => !current)}
            aria-expanded={reportsOpen}
          >
            <span className={styles.submenuTitle}>
              <FileBarChart2Icon className={styles.icon} />
              <span>Relatorios</span>
            </span>
            <ChevronDown
              className={
                reportsOpen ? styles.submenuChevronOpen : styles.submenuChevron
              }
            />
          </button>
          <div
            className={
              reportsOpen ? styles.submenuList : styles.submenuListHidden
            }
          >
            {reportItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? styles.subLinkActive : styles.subLink
                }
              >
                <span className={styles.subIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div> */}
        </nav>
      </div>
      <div className={styles.footer}>
        <div className={styles.footerDivider} />
        <div
          className={styles.userCard}
          onClick={() => navigate(`/config/${user?.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(`/config/${user?.id}`);
            }
          }}
        >
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{displayEmail}</div>
          </div>
        </div>

        <NavLink
          to={"/config"}
          className={({ isActive }) =>
            isActive ? styles.active : styles.linkButton
          }
        >
          <FiSettings className={styles.icon} />
          <span>Configurações</span>
        </NavLink>

        <NavLink
          onClick={() => handleLogout()}
          to={""}
          className={({ isActive }) =>
            isActive ? styles.buttonExit : styles.linkButton
          }
        >
          <IoExitOutline className={styles.icon} color="red" />
          <span>Sair</span>
        </NavLink>
      </div>
    </aside>
  );
}
