import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./SupplierDetails.module.css";
import { SupplierService } from "../../service/Supplier.service";
import type { SupplierRequestDto } from "../../dtos/request/supplier-request.dto";
import { Save } from "lucide-react";
import { ButtonBack } from "../../components/ButtonBack/ButtonBack";

export function SupplierDetails() {
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();
	const isEdit = !!id;
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [fantasyName, setFantasyName] = useState("");
	const [corporateName, setCorporateName] = useState("");
	const [cnpj, setCnpj] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [cep, setCep] = useState("");
	const [street, setStreet] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [category, setCategory] = useState("");
	const [website, setWebsite] = useState("");
	const [stateRegistration, setStateRegistration] = useState("");
	const [logoName, setLogoName] = useState("");
	const [saving, setSaving] = useState(false);

	const onPickLogo = () => {
		fileInputRef.current?.click();
	};

	const onLogoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setLogoName(file.name);
		event.target.value = "";
	};

	const onClearForm = () => {
		setFantasyName("");
		setCorporateName("");
		setCnpj("");
		setEmail("");
		setPhone("");
		setCep("");
		setStreet("");
		setCity("");
		setState("");
		setCategory("");
		setWebsite("");
		setStateRegistration("");
		setLogoName("");
	};

	useEffect(() => {
		const loadSupplier = async () => {
			if (!isEdit || !id) {
				onClearForm();
				return;
			}

			const data = await SupplierService.findOne(id);

			setFantasyName(String(data?.name ?? ""));
			setCorporateName("");
			setCnpj("");
			setEmail(String(data?.email ?? ""));
			setPhone(String(data?.phone ?? ""));
			setCategory(String(data?.category ?? ""));
			setWebsite("");
			setStateRegistration("");
			setLogoName("");

			const location = String(data?.location ?? "");
			setCep("");
			setStreet(location);
			setCity("");
			setState("");
		};

		loadSupplier();
	}, [id, isEdit]);

	const onSave = async () => {
		if (saving) return;

		const locationParts = [street.trim(), city.trim(), state.trim()].filter(
			(part) => part.length > 0,
		);
		const location = locationParts.length
			? locationParts.join(", ")
			: undefined;

		const payload: SupplierRequestDto = {
			name: fantasyName.trim() || corporateName.trim(),
			category: category.trim() || undefined,
			email: email.trim() || undefined,
			phone: phone.trim() || undefined,
			location,
		};

		try {
			setSaving(true);
			if (isEdit && id) {
				await SupplierService.update(id, payload);
				navigate(-1);
				return;
			}

			await SupplierService.create(payload);
			navigate(-1);
		} finally {
			setSaving(false);
		}
	};

	const actionLabel = isEdit ? "Salvar alterações" : "Criar fornecedor";
	const loadingLabel = isEdit ? "Salvando..." : "Criando...";

	return (
		<div className={styles.page}>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				style={{ display: "none" }}
				onChange={onLogoSelected}
			/>

			<div className={styles.top}>
				<div style={{display: "flex", alignItems: "center"}}>
					<ButtonBack />
					<div>
						<h1 className={styles.title}>
							{isEdit ? "Editar fornecedor" : "Cadastro de novo fornecedor"}
						</h1>
						<p className={styles.subtitle}>
							{isEdit
								? "Atualize as informações principais do fornecedor."
								: "Preencha as informações principais do fornecedor."}
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
				<aside className={styles.logoCard}>
					<div className={styles.logoTitle}>Logo do fornecedor</div>
					<button
						className={styles.logoUpload}
						type="button"
						onClick={onPickLogo}
					>
						<div className={styles.logoIcon}>+</div>
						<div className={styles.logoText}>
							{logoName ? logoName : "Clique para enviar"}
						</div>
						<div className={styles.logoHint}>PNG ou JPG (max. 5MB)</div>
					</button>
					<p className={styles.logoTip}>
						Dica: use imagens com boa resolução para identificar a marca.
					</p>
				</aside>

				<div className={styles.formColumn}>
					<section className={styles.panel}>
						<div className={styles.panelHeader}>
							<span className={styles.panelNumber}>1</span>
							<span className={styles.panelTitle}>Informações da empresa</span>
						</div>

						<div className={styles.form}>
							<label className={styles.field}>
								<span className={styles.label}>Nome fantasia</span>
								<input
									className={styles.input}
									placeholder="Ex: Pinha Distribuidora"
									value={fantasyName}
									onChange={(event) => setFantasyName(event.target.value)}
								/>
							</label>

							<div className={styles.row2}>
								<label className={styles.field}>
									<span className={styles.label}>Razão social</span>
									<input
										className={styles.input}
										placeholder="Ex: Pinha Comércio de Alimentos"
										value={corporateName}
										onChange={(event) => setCorporateName(event.target.value)}
									/>
								</label>
								<label className={styles.field}>
									<span className={styles.label}>CNPJ</span>
									<input
										className={styles.input}
										placeholder="00.000.000/0000-00"
										value={cnpj}
										onChange={(event) => setCnpj(event.target.value)}
									/>
								</label>
							</div>
						</div>
					</section>

					<section className={styles.panel}>
						<div className={styles.panelHeader}>
							<span className={styles.panelNumber}>2</span>
							<span className={styles.panelTitle}>Contato e endereço</span>
						</div>

						<div className={styles.form}>
							<div className={styles.row2}>
								<label className={styles.field}>
									<span className={styles.label}>E-mail</span>
									<input
										className={styles.input}
										placeholder="contato@fornecedor.com.br"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
									/>
								</label>
								<label className={styles.field}>
									<span className={styles.label}>Telefone/WhatsApp</span>
									<input
										className={styles.input}
										placeholder="(00) 00000-0000"
										value={phone}
										onChange={(event) => setPhone(event.target.value)}
									/>
								</label>
							</div>

							<div className={styles.row2}>
								<label className={styles.field}>
									<span className={styles.label}>CEP</span>
									<input
										className={styles.input}
										placeholder="00000-000"
										value={cep}
										onChange={(event) => setCep(event.target.value)}
									/>
								</label>
								<label className={styles.field}>
									<span className={styles.label}>Logradouro</span>
									<input
										className={styles.input}
										placeholder="Rua, Avenida, etc."
										value={street}
										onChange={(event) => setStreet(event.target.value)}
									/>
								</label>
							</div>

							<div className={styles.row2}>
								<label className={styles.field}>
									<span className={styles.label}>Cidade</span>
									<input
										className={styles.input}
										placeholder="Ex: São Paulo"
										value={city}
										onChange={(event) => setCity(event.target.value)}
									/>
								</label>
								<label className={styles.field}>
									<span className={styles.label}>Estado</span>
									<select
										className={styles.select}
										value={state}
										onChange={(event) => setState(event.target.value)}
									>
										<option value="">Selecione o estado</option>
										<option value="SP">São Paulo</option>
										<option value="RJ">Rio de Janeiro</option>
										<option value="MG">Minas Gerais</option>
										<option value="PR">Paraná</option>
									</select>
								</label>
							</div>
						</div>
					</section>

					<section className={styles.panel}>
						<div className={styles.panelHeader}>
							<span className={styles.panelNumber}>3</span>
							<span className={styles.panelTitle}>
								Detalhes do fornecimento
							</span>
						</div>

						<div className={styles.form}>
							<div className={styles.row2}>
								<label className={styles.field}>
									<span className={styles.label}>Categoria</span>
									<select
										className={styles.select}
										value={category}
										onChange={(event) => setCategory(event.target.value)}
									>
										<option value="">Selecione a categoria</option>
										<option value="camisa">Camisa</option>
										<option value="camiseta">Camiseta</option>
										<option value="polo">Polo</option>
										<option value="shorts">Shorts</option>
										<option value="jaqueta">Jaqueta</option>
										<option value="calca">Calça</option>
										<option value="vestido">Vestido</option>
										<option value="sueter">Suéter</option>
										<option value="moletom">Moletom</option>
										<option value="cueca">Cueca</option>
										<option value="calcado">Calçado</option>
										<option value="cinto">Cinto</option>
										<option value="carteira">Carteira</option>
										<option value="oculos">Óculos</option>
									</select>
								</label>
								<label className={styles.field}>
									<span className={styles.label}>Website</span>
									<input
										className={styles.input}
										placeholder="https://www.fornecedor.com.br"
										value={website}
										onChange={(event) => setWebsite(event.target.value)}
									/>
								</label>
							</div>

							<label className={styles.field}>
							<span className={styles.label}>Inscrição estadual</span>
								<input
									className={styles.input}
									placeholder="000.000.000.000"
									value={stateRegistration}
									onChange={(event) => setStateRegistration(event.target.value)}
								/>
							</label>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
