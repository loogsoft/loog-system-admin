function phoneMask(value: string): string {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.slice(0, 11);
  if (value.length <= 10) {
    return value
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    return value
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
}

function cpfMask(value: string): string {
  if (!value) return "";

  value = value.replace(/\D/g, "").slice(0, 11);

  return value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function cepMask(value: string): string {
  if (!value) return "";

  value = value.replace(/\D/g, "").slice(0, 8);

  return value.replace(/^(\d{5})(\d)/, "$1-$2");
}
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./CreditDetails.module.css";
import { Save } from "lucide-react";
import { ImageGallery } from "../../components/ImageGallery/ImageGallery";
import { ButtonBack } from "../../components/ButtonBack/ButtonBack";
import { CreditCustomerService } from "../../service/Credit-customer.service";
import { useAuth } from "../../contexts/useAuth";

export function CreditDetails() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageNames, setImageNames] = useState<string[]>([]);
  // Removido imageFiles/setImageFiles pois não são usados
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuth();
  const companyId = user?.companyId;

  const onPickImages = () => {
    fileInputRef.current?.click();
  };

  const onImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setImageNames((prev) => [...prev, ...files.map((file) => file.name)]);
    // removido setImageFiles

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
    // removido setImageFiles
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (selectedImageIndex >= imagePreviews.length - 1) {
      setSelectedImageIndex(Math.max(0, imagePreviews.length - 2));
    }
  };
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [CPF, setCPF] = useState("");
  const [phone, setPhone] = useState("");
  const [road, setRoad] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  // const [totalAmounts, setTotalAmounts] = useState("");
  // const [date, setDate] = useState("");

  useEffect(() => {
    // Aqui você pode buscar os dados do crediário para edição se necessário
    // Exemplo:
    // if (isEdit && id) { ...busca crediário e preenche os campos... }
  }, [id, isEdit]);

  const onSave = async () => {
    if (saving) return;
    if (!customerName.trim()) {
      alert("Nome do cliente é obrigatório");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      alert("Informe um e-mail válido");
      return;
    }
    const cpfNum = CPF.replace(/\D/g, "");
    if (!cpfNum || cpfNum.length !== 11) {
      alert("CPF deve conter 11 dígitos numéricos");
      return;
    }
    if (!phone.trim()) {
      alert("Telefone é obrigatório");
      return;
    }
    if (
      !road.trim() ||
      !number.trim() ||
      !neighborhood.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zipCode.trim()
    ) {
      alert("Preencha todos os campos de endereço");
      return;
    }
    // Monta o payload conforme o DTO de request (sem o campo date)
    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      CPF: CPF.replace(/\D/g, ""),
      phone: phone.replace(/\D/g, ""),
      road: road.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      comapnyId: companyId || ""
    };
    try {
      setSaving(true);
      await CreditCustomerService.create(payload);
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = isEdit ? "Salvar alterações" : "Cadastrar crediário";
  const loadingLabel = isEdit ? "Salvando..." : "Cadastrando...";

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <ButtonBack />
          <div>
            <h1 className={styles.title}>
              {isEdit ? "Editar crediário" : "Cadastro de crediário"}
            </h1>
            <p className={styles.subtitle}>
              {isEdit
                ? "Atualize as informações do crediário."
                : "Preencha as informações do crediário."}
            </p>
          </div>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={onImagesSelected}
        />
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
        <div className={styles.formColumn} style={{ marginBottom: 40 }}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                Informações do crediário
              </span>
            </div>
            <div className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>Nome do cliente</span>
                <input
                  className={styles.input}
                  placeholder="Nome completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  className={styles.input}
                  placeholder="Email do cliente"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>CPF</span>
                <input
                  className={styles.input}
                  placeholder="CPF"
                  value={cpfMask(CPF)}
                  onChange={(e) => setCPF(e.target.value.replace(/\D/g, "").slice(0, 11))}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Telefone</span>
                <input
                  className={styles.input}
                  placeholder="Telefone"
                  value={phoneMask(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Rua</span>
                <input
                  className={styles.input}
                  placeholder="Rua"
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Número</span>
                <input
                  className={styles.input}
                  placeholder="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Bairro</span>
                <input
                  className={styles.input}
                  placeholder="Bairro"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Cidade</span>
                <input
                  className={styles.input}
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Estado</span>
                <input
                  className={styles.input}
                  placeholder="Estado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>CEP</span>
                <input
                  className={styles.input}
                  placeholder="CEP"
                  value={cepMask(zipCode)}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
