import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import styles from "./Profille.module.css";

export function Profille() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: user?.name || "Alex Johnson",
    email: user?.email || "alex.johnson@pinna.com",
    cpf: "000.000.000-00",
    telefone: "(11) 99999-9999",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log("Salvando alterações:", formData);
    // TODO: Implementar chamada à API
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações de Perfil</h1>
          <p className={styles.subtitle}>
            Gerencie suas informações pessoais e credenciais de acesso.
          </p>
        </div>
        <button className={styles.saveButton} onClick={handleSave}>
          💾 Salvar Alterações
        </button>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
            alt="Avatar"
          />
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{formData.nomeCompleto}</h2>
          <div className={styles.profileMeta}>
            <span className={styles.badge}>ADMINISTRADOR</span>
            <span className={styles.memberDate}>Membro desde Jan 2024</span>
          </div>
          <p className={styles.profileDescription}>
            Responsável pelo gerenciamento geral da plataforma e supervisão de
            relatórios corporativos do Pinha System.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formSection}>
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
              value={formData.cpf}
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
              value={formData.telefone}
              onChange={handleChange}
              className={styles.input}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionIcon}>🔒</div>
          <h3 className={styles.sectionTitle}>Segurança</h3>

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
                {showCurrentPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
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
                {showConfirmPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>
          </div>

          <div className={styles.hint}>
            <strong>Dica:</strong> Use pelo menos 8 caracteres, incluindo números
            e símbolos para uma conta mais segura
          </div>
        </div>
      </div>
    </main>
  );
}
