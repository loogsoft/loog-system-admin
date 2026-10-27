import api from "../api";

export type InstagramAccountDto = {
  id: string;
  username: string;
  name?: string;
  account_type: string;
};

export type InstagramMediaResponseDto = {
  id: string;
};

export type InstagramMediaStatusDto = {
  id: string;
  status_code:
    | "IN_PROGRESS"
    | "FINISHED"
    | "ERROR"
    | "EXPIRED"
    | "PUBLISHED";
};

export const InstagramService = {
  getAccount: async (): Promise<InstagramAccountDto> => {
    const response = await api.get<InstagramAccountDto>("/insta/account");

    return response.data;
  },

  criarMidia: async (
    imageUrl: string,
    caption: string
  ): Promise<InstagramMediaResponseDto> => {
    const response = await api.post<InstagramMediaResponseDto>("/insta/media", {
      imageUrl,
      caption,
    });

    return response.data;
  },

  verificarStatus: async (
    containerId: string
  ): Promise<InstagramMediaStatusDto> => {
    const response = await api.get<InstagramMediaStatusDto>(
      `/insta/media/${encodeURIComponent(containerId)}/status`
    );

    return response.data;
  },

  publicar: async (
    containerId: string
  ): Promise<InstagramMediaResponseDto> => {
    const response = await api.post<InstagramMediaResponseDto>("/insta/publish", {
      containerId,
    });

    return response.data;
  },
};
