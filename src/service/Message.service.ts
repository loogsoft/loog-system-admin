import type { MessageRequestDto } from "../dtos/request/message-request.dto";
import type { MessageResponseDto } from "../dtos/response/message-response.dto";
import api from "./api";

export const MessageService = {
  async create(dto: MessageRequestDto): Promise<MessageResponseDto> {
    const { data } = await api.post("/messages", dto);
    return data;
  },

  async findAll(companyId: string): Promise<MessageResponseDto[]> {
    const { data } = await api.get(`/messages/find-all/${companyId}`);
    return data;
  },

  async findOne(companyId: string, id: string): Promise<MessageResponseDto> {
    const { data } = await api.get(`/messages/companyId/${companyId}/${id}`);
    return data;
  },

  async update(
    productId: string,
    dto: MessageRequestDto,
  ): Promise<MessageResponseDto> {
    const { data } = await api.put(`/messages/${productId}`, dto);
    return data;
  },

  async remove(id: string, companyId: string): Promise<string> {
    const { data } = await api.delete(`/messages/companyId/${companyId}/${id}`);
    return data;
  },
};
