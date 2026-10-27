import api from "../../service/api";

export type AiResponseDto = {
  sucesso: boolean;
  legenda: string;
  imagem: {
    base64: string;
    mimeType: string;
  };
};

export const AiService = {
  gerarPublicacao: async (
    imagem: File,
    mensagem: string
  ): Promise<AiResponseDto> => {
    const formData = new FormData();

    formData.append("imagem", imagem);
    formData.append("mensagem", mensagem);

    const response = await api.post<AiResponseDto>(
      "/ai/gerar-publicacao",
      formData
    );

    return response.data;
  },

  perguntar: async (mensagem: string): Promise<unknown> => {
    const response = await api.post("/ai/perguntar", {
      mensagem,
    });

    return response.data;
  },

  listarModelos: async (): Promise<unknown> => {
    const response = await api.get("/ai/modelos");

    return response.data;
  },
};