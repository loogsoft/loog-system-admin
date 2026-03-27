import { NavLink, useNavigate } from "react-router-dom";
import { FiSettings, FiChevronDown, FiUsers } from "react-icons/fi";
import styles from "./Sidebar.module.css";
import { IoExitOutline } from "react-icons/io5";
import { useAuth } from "../../contexts/useAuth";
import { useTheme } from "../../contexts/useTheme";
import { useEffect, useState } from "react";
import {
  Dashboard,
  Store,
  ShoppingCart,
  People,
  Notifications,
  BarChart,
  CreditCardRounded,
  Casino,
  WorkspacePremiumTwoTone,
  WorkspacePremium,
} from "@mui/icons-material";
import { UserTypeEnum } from "../../dtos/enums/user-type.enum";

// Estrutura dinâmica do menu
const menu = [
  {
    type: "item",
    icon: Dashboard,
    label: "Dashboard",
    path: "/dashboard",
    color: "#6C63FF",
  },
  {
    type: "item",
    icon: Store,
    label: "Produtos",
    path: "/produtos",
    color: "#00B894",
  },
  {
    type: "item",
    icon: ShoppingCart,
    label: "Baixa de estoque",
    path: "/discount-stock",
    color: "#005ca2",
  },
  {
    type: "item",
    icon: Notifications,
    label: "Sem estoque",
    path: "/out-of-stock",
    color: "#E17055",
  },
  {
    type: "item",
    icon: People,
    label: "Fornecedores",
    path: "/suppliers",
    color: "#F0932B",
  },
  {
    type: "item",
    icon: CreditCardRounded,
    label: "Crediarios",
    path: "/credit",
    color: "#ffd900",
  },
  {
    type: "group",
    icon: BarChart,
    label: "Estratégias",
    color: "#438fe1",
    key: "estrategias",
    children: [
      {
        type: "item",
        icon: Casino,
        label: "Roleta",
        path: "/roulette",
        color: "#6C63FF",
      },
    ],
  },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});
  const [name, setName] = useState("");

  useEffect(() => {
    const companyData = localStorage.getItem("company");
    if (companyData) {
      const company = JSON.parse(companyData);
      if (company.companyName) {
        setName(company.companyName || company.name || "");
      } else {
        setName("Loog System");
      }
    }
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "usuario@email.com";
  const initials = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const renderItem = (item: any) => {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive: navActive }) =>
          navActive ? styles.active : styles.link
        }
        style={{ gap: 12 }}
      >
        <item.icon
          className={styles.icon}
          style={{ color: item.color }}
          size={20}
        />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const renderGroup = (group: any) => {
    const isOpen = !!openGroups[group.key];
    return (
      <div key={group.key}>
        <button
          type="button"
          className={styles.linkk}
          onClick={() =>
            setOpenGroups((prev) => ({
              ...prev,
              [group.key]: !prev[group.key],
            }))
          }
          aria-expanded={isOpen}
        >
          <group.icon
            className={styles.icon}
            style={{ color: group.color }}
            size={20}
          />
          <span style={{ flex: 1, textAlign: "left", fontSize: 15 }}>
            {group.label}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: 2,
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "none",
            }}
          >
            <FiChevronDown size={18} color="#B0B3B9" />
          </span>
        </button>
        <div
          className={isOpen ? styles.submenuList : styles.submenuListHidden}
          style={{ paddingLeft: 20, marginTop: 0 }}
        >
          {isOpen && group.children.map((child: any) => renderItem(child))}
        </div>
      </div>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <div
            style={{
              border: "2px solid var(--highlight-primary)",
              borderRadius: "30%",
              padding: "3px 7px",
            }}
          >
            <WorkspacePremium
              style={{ fontSize: "30px", color: "var(--highlight-primary)" }}
            />
          </div>
          <div>
            <strong
              className={styles.brandTitle}
              style={{ fontSize: 18, letterSpacing: 2 }}
            >
              {name}
            </strong>
          </div>
        </div>
        <div className={styles.footerDivider} />

        <nav className={styles.menu}>
          {menu.map((node) =>
            node.type === "group" ? renderGroup(node) : renderItem(node),
          )}
        </nav>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerDivider} />
        {user?.userType === UserTypeEnum.ADMIN && (
          <div>
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
              style={{ gap: 12 }}
            >
              <FiSettings className={styles.icon} color="#636E72" size={20} />
              <span>Configurações</span>
            </NavLink>

            <NavLink
              to={"/collaborators"}
              className={({ isActive }) =>
                isActive ? styles.active : styles.linkButton
              }
              style={{ gap: 12 }}
            >
              <FiUsers className={styles.icon} color="#636E72" size={20} />
              <span>Colaboradores</span>
            </NavLink>
          </div>
        )}
        <NavLink
          onClick={() => handleLogout()}
          to={""}
          className={({ isActive }) =>
            isActive ? styles.buttonExit : styles.linkButton
          }
          style={{ gap: 12 }}
        >
          <IoExitOutline className={styles.icon} color="#D63031" size={20} />
          <span>Sair</span>
        </NavLink>
      </div>
    </aside>
  );
}
