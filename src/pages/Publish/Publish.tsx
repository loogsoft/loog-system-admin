import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  Instagram,
  LoaderCircle,
  PencilLine,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import styles from "./Publish.module.css";
import { AiService } from "../../ai/service/ai.service";
import { CloudinaryService } from "../../service/cloudinary/cloudinary.service";
import { InstagramService } from "../../service/insta/insta.service";
import type { InstagramAccountDto } from "../../service/insta/insta.service";

type SelectedImage = {
  file: File;
  url: string;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_CAPTION_LENGTH = 2200;
const STEPS = [
  { title: "Prepare", description: "Imagem e instruções" },
  { title: "Revise", description: "Imagem e legenda" },
  { title: "Publique", description: "Confirme antes de enviar" },
];

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{
    message?: string | string[];
    error?: { message?: string; error_user_msg?: string };
  }>(error)) {
    const responseData = error.response?.data;
    const instagramMessage = responseData?.error?.error_user_msg || responseData?.error?.message;
    if (instagramMessage) return instagramMessage;
    if (typeof responseData?.message === "string" && responseData.message.trim()) {
      return responseData.message;
    }
    if (Array.isArray(responseData?.message) && responseData.message.length > 0) {
      return responseData.message.join(" ");
    }
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function Publish() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const publishRequestRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [caption, setCaption] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratedImageReady, setIsGeneratedImageReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccountDto | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishProgress, setPublishProgress] = useState("");
  const [containerId, setContainerId] = useState<string | null>(null);
  const [publishedMediaId, setPublishedMediaId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const isBusy = isGenerating || isPublishing;
  const canGenerate = isImageReady && instructions.trim().length > 0 && !isBusy;
  const canConfirm = !isBusy && !isPublished && isGeneratedImageReady && caption !== null &&
    caption.trim().length > 0 && caption.length <= MAX_CAPTION_LENGTH;
  const canPublish = canConfirm && isConfirmed && instagramAccount !== null && !isTestingConnection;
  const previewImageUrl = generatedImageUrl ?? (isImageReady ? selectedImage?.url : null);
  let currentStep = 0;
  let previewStatus = "Rascunho";

  if (isConfirmed) {
    currentStep = 2;
    previewStatus = "Confirmada";
  } else if (caption !== null) {
    currentStep = 1;
    previewStatus = "Em revisão";
  }

  if (isGenerating) previewStatus = "Gerando...";
  if (isPublishing) previewStatus = "Publicando...";
  if (isPublished) previewStatus = "Publicada";

  let connectionStatus = "Não testada";
  if (isTestingConnection) connectionStatus = "Testando...";
  else if (instagramAccount) connectionStatus = "Conectado";
  else if (connectionError) connectionStatus = "Falha na conexão";

  let reviewMessage = "Sua publicação só será enviada depois da sua confirmação.";
  if (caption !== null) reviewMessage = "Revise a imagem e a legenda antes de confirmar.";
  if (isConfirmed) {
    reviewMessage = instagramAccount
      ? `Conteúdo confirmado para @${instagramAccount.username}. Você já pode publicar.`
      : "Conteúdo confirmado. Teste a conexão com o Instagram para publicar.";
  }
  if (isPublishing) reviewMessage = publishProgress;
  if (isPublished) reviewMessage = "Publicação enviada ao Instagram com sucesso.";

  let ReviewIcon = Info;
  if (isConfirmed) ReviewIcon = CheckCircle2;
  if (isPublishing) ReviewIcon = LoaderCircle;

  let PublishIcon = Send;
  let publishButtonLabel = "Publicar no Instagram";
  if (isPublished) {
    PublishIcon = CheckCircle2;
    publishButtonLabel = "Publicado";
  }
  if (isPublishing) {
    PublishIcon = LoaderCircle;
    publishButtonLabel = "Publicando...";
  }

  useEffect(() => {
    if (!selectedImage) return;

    return () => URL.revokeObjectURL(selectedImage.url);
  }, [selectedImage]);

  function resetPreview() {
    setCaption(null);
    setIsConfirmed(false);
    setGeneratedImageUrl(null);
    setIsGeneratedImageReady(false);
    setGenerationError("");
    setContainerId(null);
    setPublishError("");
    setPublishProgress("");
    setPublishedMediaId(null);
    setIsPublished(false);
  }

  function selectImage(file: File) {
    if (isBusy) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Selecione uma imagem em JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setSelectedImage({ file, url: URL.createObjectURL(file) });
    setIsImageReady(false);
    setImageError("");
    resetPreview();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) selectImage(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (isBusy) return;

    if (event.dataTransfer.files.length !== 1) {
      setImageError("Adicione uma imagem por publicação.");
      return;
    }

    selectImage(event.dataTransfer.files[0]);
  }

  function removeImage() {
    if (isBusy) return;

    setSelectedImage(null);
    setIsImageReady(false);
    setImageError("");
    resetPreview();
  }

  async function generatePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate || !selectedImage) return;

    resetPreview();
    setIsGenerating(true);

    try {
      const response = await AiService.gerarPublicacao(
        selectedImage.file,
        instructions.trim(),
      );

      if (
        !response?.sucesso ||
        typeof response.imagem?.base64 !== "string" ||
        !response.imagem.base64.trim() ||
        !IMAGE_TYPES.includes(response.imagem.mimeType) ||
        typeof response.legenda !== "string" ||
        !response.legenda.trim()
      ) {
        throw new Error("A API não retornou uma imagem e uma legenda válidas. Tente gerar novamente.");
      }

      setGeneratedImageUrl(`data:${response.imagem.mimeType};base64,${response.imagem.base64.trim()}`);
      setCaption(response.legenda);
    } catch (error: unknown) {
      setGenerationError(getRequestErrorMessage(error, "Não foi possível gerar a publicação. Tente novamente."));
    } finally {
      setIsGenerating(false);
    }
  }

  async function testInstagramConnection() {
    if (isTestingConnection || isPublishing) return;

    setIsTestingConnection(true);
    setConnectionError("");
    setInstagramAccount(null);

    try {
      const account = await InstagramService.getAccount();
      if (!account?.id || !account.username) {
        throw new Error("O Instagram não retornou o ID e o nome de usuário da conta.");
      }

      if (instagramAccount && instagramAccount.id !== account.id) {
        setIsConfirmed(false);
        setContainerId(null);
      }
      setInstagramAccount(account);
    } catch (error: unknown) {
      setConnectionError(getRequestErrorMessage(error, "Não foi possível conectar ao Instagram. Confira o token, o ID e as permissões da conta."));
    } finally {
      setIsTestingConnection(false);
    }
  }

  async function publishToInstagram() {
    if (!canPublish || !generatedImageUrl || !caption || publishRequestRef.current) return;

    publishRequestRef.current = true;
    setIsPublishing(true);
    setPublishError("");

    try {
      let activeContainerId = containerId;

      if (!activeContainerId) {
        setPublishProgress("Preparando e enviando a imagem...");
        const imageUrl = await CloudinaryService.uploadImage(generatedImageUrl);
        setPublishProgress("Criando a publicação no Instagram...");
        const container = await InstagramService.criarMidia(imageUrl, caption.trim());
        if (!container?.id) throw new Error("O Instagram não retornou o identificador da mídia.");
        activeContainerId = container.id;
        setContainerId(container.id);
      }

      // Reutiliza a mesma mídia ao tentar novamente para evitar publicações duplicadas.
      for (let attempt = 0; attempt < 5; attempt++) {
        setPublishProgress("Aguardando o Instagram processar a imagem...");
        const mediaStatus = await InstagramService.verificarStatus(activeContainerId);

        if (mediaStatus.status_code === "PUBLISHED") {
          setIsPublished(true);
          return;
        }

        if (mediaStatus.status_code === "FINISHED") {
          setPublishProgress("Publicando no Instagram...");
          const publishedMedia = await InstagramService.publicar(activeContainerId);
          if (!publishedMedia?.id) throw new Error("O Instagram não confirmou o identificador da publicação. Tente verificar novamente.");
          setPublishedMediaId(publishedMedia.id);
          setIsPublished(true);
          return;
        }

        if (mediaStatus.status_code === "ERROR" || mediaStatus.status_code === "EXPIRED") {
          setContainerId(null);
          throw new Error("O Instagram não conseguiu processar a imagem. Tente publicar novamente.");
        }

        if (mediaStatus.status_code !== "IN_PROGRESS") {
          throw new Error("O Instagram retornou um status de mídia desconhecido.");
        }

        if (attempt < 4) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 60_000));
        }
      }

      throw new Error("O Instagram ainda está processando a imagem. Clique em publicar novamente para verificar o andamento.");
    } catch (error: unknown) {
      setPublishError(getRequestErrorMessage(error, "Não foi possível confirmar a publicação. Tente novamente para verificar a mesma mídia."));
    } finally {
      publishRequestRef.current = false;
      setIsPublishing(false);
      setPublishProgress("");
    }
  }

  return (
    <section className={styles.page} aria-labelledby="publish-title">
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Conteúdo e presença digital</span>
            <h1 id="publish-title" className={styles.title}>Publicações</h1>
            <p className={styles.subtitle}>
              Da sua ideia ao Instagram. Crie com IA, revise cada detalhe e publique.
            </p>
          </div>
          <span className={styles.demoBadge}>
            <Sparkles size={16} aria-hidden="true" /> Criação com IA
          </span>
        </header>

        <section id="instagram-status" className={styles.connectionNotice} aria-labelledby="instagram-connection-title" aria-busy={isTestingConnection}>
          <span className={styles.connectionIcon}><Instagram size={22} aria-hidden="true" /></span>
          <div className={styles.connectionDetails}>
            <strong id="instagram-connection-title">Conta do Instagram</strong>
            {instagramAccount ? (
              <dl className={styles.accountDetails}>
                <div><dt>Nome</dt><dd>{instagramAccount.name || instagramAccount.username}</dd></div>
                <div><dt>Usuário</dt><dd>@{instagramAccount.username}</dd></div>
                <div><dt>ID da conta</dt><dd>{instagramAccount.id}</dd></div>
              </dl>
            ) : (
              <p>Teste a conexão para identificar a conta que receberá suas publicações.</p>
            )}
            {connectionError && <p className={styles.connectionError} role="alert">{connectionError}</p>}
          </div>
          <div className={styles.connectionActions}>
            <span className={`${styles.connectionBadge} ${instagramAccount ? styles.connectionBadgeSuccess : ""} ${connectionError ? styles.connectionBadgeError : ""}`} role="status">
              {connectionStatus}
            </span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={testInstagramConnection}
              disabled={isTestingConnection || isPublishing}
            >
              {isTestingConnection ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> : <Instagram size={16} aria-hidden="true" />}
              {isTestingConnection ? "Testando conexão..." : "Testar conexão"}
            </button>
          </div>
        </section>

        <ol className={styles.steps} aria-label="Etapas da publicação">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={`${styles.step} ${index <= currentStep ? styles.stepActive : ""}`}
              aria-current={index === currentStep ? "step" : undefined}
            >
              <span className={styles.stepNumber}>
                {index < currentStep ? <Check size={17} aria-hidden="true" /> : index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className={styles.stepArrow} size={17} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className={styles.contentGrid}>
          <form className={styles.card} onSubmit={generatePreview} aria-busy={isBusy}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}><Sparkles size={21} aria-hidden="true" /></span>
              <div>
                <h2>Nova publicação</h2>
                <p>Você traz a ideia. A IA ajuda a dar forma.</p>
              </div>
            </div>

            <div className={styles.fieldHeading}>
              <label htmlFor="publish-image">Imagem da publicação</label>
              <span>Obrigatória</span>
            </div>
            <input
              ref={fileInputRef}
              id="publish-image"
              className={styles.fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isBusy}
              aria-describedby={imageError ? "publish-image-error" : "publish-image-hint"}
              aria-invalid={!!imageError}
              tabIndex={-1}
            />
            <button
              type="button"
              className={`${styles.uploadArea} ${isDragging ? styles.uploadDragging : ""} ${imageError ? styles.uploadError : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isBusy) setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              aria-label={selectedImage ? "Trocar imagem da publicação" : "Adicionar imagem da publicação"}
              aria-describedby={imageError ? "publish-image-error" : "publish-image-hint"}
            >
              {selectedImage ? (
                <>
                  <img
                    key={selectedImage.url}
                    src={selectedImage.url}
                    alt="Imagem selecionada para a publicação"
                    className={styles.uploadPreview}
                    onLoad={() => setIsImageReady(true)}
                    onError={() => {
                      removeImage();
                      setImageError("Não foi possível abrir esta imagem. Escolha outro arquivo.");
                    }}
                  />
                  <span className={styles.replaceImage}><Upload size={14} aria-hidden="true" /> Trocar imagem</span>
                </>
              ) : (
                <>
                  <span className={styles.uploadIcon}><ImagePlus size={27} aria-hidden="true" /></span>
                  <strong>Clique para adicionar uma imagem</strong>
                  <span>ou arraste e solte aqui</span>
                  <span className={styles.uploadFormats}>JPG, PNG ou WEBP · Até 10 MB</span>
                </>
              )}
            </button>
            {selectedImage && (
              <div className={styles.fileDetails}>
                <span title={selectedImage.file.name}>{selectedImage.file.name}</span>
                <button type="button" onClick={removeImage} disabled={isBusy} aria-label="Remover imagem" title="Remover imagem">
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            )}
            {imageError && <p id="publish-image-error" className={styles.fieldError} role="alert">{imageError}</p>}
            <p id="publish-image-hint" className={styles.fieldHint}>Use uma foto do produto ou da ideia que deseja divulgar.</p>

            <div className={styles.instructionsField}>
              <label htmlFor="publish-instructions">O que você quer criar?</label>
              <p id="publish-instructions-hint" className={styles.fieldHint}>
                Descreva as mudanças na imagem e o estilo da legenda.
              </p>
              <textarea
                id="publish-instructions"
                className={styles.textarea}
                placeholder="Ex.: transforme esta foto em uma publicação para divulgar meu produto. Use um fundo clean e crie uma legenda descontraída convidando os clientes para conhecer a loja."
                value={instructions}
                disabled={isBusy}
                onChange={(event) => {
                  setInstructions(event.target.value);
                  resetPreview();
                }}
                maxLength={1000}
                rows={5}
                required
                aria-describedby="publish-instructions-hint"
              />
              <span className={styles.characterCount}>{instructions.length}/1000</span>
            </div>

            <button className={styles.primaryButton} type="submit" disabled={!canGenerate}>
              {isGenerating ? (
                <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Gerando publicação...</>
              ) : (
                <><Sparkles size={17} aria-hidden="true" /> {caption !== null ? "Gerar nova prévia" : "Gerar publicação"}<ArrowRight size={16} aria-hidden="true" /></>
              )}
            </button>
            {generationError && <p className={styles.fieldError} role="alert">{generationError}</p>}
            <div className={styles.demoNotice} role="status" aria-live="polite">
              <Info size={16} aria-hidden="true" />
              <p>
                {isGenerating
                  ? "A IA está preparando sua imagem e legenda. Isso pode levar alguns instantes."
                  : "A imagem e a legenda geradas pela IA aparecerão na prévia para você revisar."}
              </p>
            </div>
          </form>

          <section className={`${styles.card} ${styles.previewCard}`} aria-labelledby="preview-title" aria-busy={isBusy}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}><Eye size={21} aria-hidden="true" /></span>
              <div>
                <h2 id="preview-title">Prévia da publicação</h2>
                <p>Veja como sua ideia vai aparecer no feed.</p>
              </div>
              <span className={`${styles.previewBadge} ${isConfirmed ? styles.confirmedBadge : ""}`}>
                {previewStatus}
              </span>
            </div>

            <div className={styles.post}>
              <div className={styles.postHeader}>
                <span className={styles.instagramIcon}><Instagram size={20} aria-hidden="true" /></span>
                <div>
                  <strong>{instagramAccount?.name || instagramAccount?.username || "Sua empresa"}</strong>
                  <span>{instagramAccount ? `@${instagramAccount.username}` : "Prévia do feed · Instagram"}</span>
                </div>
                <span className={styles.sampleLabel}>Prévia</span>
              </div>
              <div className={styles.postImage}>
                {previewImageUrl ? (
                  <img
                    key={previewImageUrl}
                    src={previewImageUrl}
                    alt={generatedImageUrl ? "Imagem gerada pela IA para a publicação" : "Prévia da imagem original"}
                    onLoad={() => {
                      if (generatedImageUrl) setIsGeneratedImageReady(true);
                    }}
                    onError={() => {
                      if (!generatedImageUrl) return;
                      resetPreview();
                      setGenerationError("Não foi possível exibir a imagem retornada pela API. Tente gerar novamente.");
                    }}
                  />
                ) : (
                  <div className={styles.emptyPreview}>
                    <span className={styles.emptyIcon}><ImagePlus size={32} strokeWidth={1.4} aria-hidden="true" /></span>
                    <strong>Sua próxima publicação começa aqui</strong>
                    <p>Adicione uma imagem e conte o que você tem em mente.</p>
                  </div>
                )}
                {previewImageUrl && <span className={styles.originalBadge}>{generatedImageUrl ? "Gerada com IA" : "Imagem original"}</span>}
              </div>
              <div className={styles.captionArea}>
                {caption !== null ? (
                  <>
                    <div className={styles.fieldHeading}>
                      <label htmlFor="publish-caption">Legenda</label>
                      <span>{isConfirmed ? "Revisada por você" : "Você pode editar"}</span>
                    </div>
                    <textarea
                      ref={captionRef}
                      id="publish-caption"
                      className={styles.captionInput}
                      value={caption}
                      onChange={(event) => {
                        setCaption(event.target.value);
                        setIsConfirmed(false);
                        setContainerId(null);
                        setPublishError("");
                      }}
                      readOnly={isConfirmed}
                      rows={6}
                      maxLength={MAX_CAPTION_LENGTH}
                    />
                    <span className={styles.characterCount}>{caption.length}/{MAX_CAPTION_LENGTH}</span>
                    {caption.length > MAX_CAPTION_LENGTH && (
                      <p className={styles.fieldError}>Reduza a legenda para até {MAX_CAPTION_LENGTH} caracteres antes de confirmar.</p>
                    )}
                  </>
                ) : (
                  <div className={styles.captionPlaceholder}>
                    <span /><span /><span />
                    <p>A legenda aparecerá aqui. Gere a prévia para revisar.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.reviewStatus} ${isPublished ? styles.publishSuccess : ""}`} role="status" aria-live="polite">
              <ReviewIcon className={isPublishing ? styles.spinner : undefined} size={16} aria-hidden="true" />
              <span>{reviewMessage}</span>
            </div>
            {publishedMediaId && <p className={styles.fieldHint}>ID da publicação: {publishedMediaId}</p>}
            {publishError && <p className={styles.fieldError} role="alert">{publishError}</p>}
            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={!canConfirm}
                onClick={() => {
                  setIsConfirmed(!isConfirmed);
                  if (isConfirmed) captionRef.current?.focus();
                }}
              >
                {isConfirmed ? <PencilLine size={16} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
                {isConfirmed ? "Editar publicação" : "Confirmar conteúdo"}
              </button>
              <button type="button" className={styles.primaryButton} disabled={!canPublish} onClick={publishToInstagram} aria-describedby="instagram-status">
                <PublishIcon className={isPublishing ? styles.spinner : undefined} size={16} aria-hidden="true" /> {publishButtonLabel}
              </button>
            </div>
          </section>
        </div>

      </div>
    </section>
  );
}
