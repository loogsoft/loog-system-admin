import api from "../api";

type CloudinaryImageResponse = {
  url: string;
  publicId: string;
};

export const CloudinaryService = {
  uploadImage: async (imageDataUrl: string): Promise<string> => {
    const image = new Image();
    image.src = imageDataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar a imagem para publicação.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível converter a imagem para JPEG."));
      }, "image/jpeg", 0.95);
    });

    if (blob.size > 10 * 1024 * 1024) {
      throw new Error("A imagem preparada para publicação deve ter no máximo 10 MB.");
    }

    const formData = new FormData();
    formData.append("file", blob, "publicacao-instagram.jpg");
    const response = await api.post<CloudinaryImageResponse>("/cloudinary/images", formData);

    if (!response.data?.url?.startsWith("https://")) {
      throw new Error("O Cloudinary não retornou uma URL HTTPS para a imagem.");
    }

    return response.data.url;
  },
};
