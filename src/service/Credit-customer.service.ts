import type { CreditCustomerRequestDto } from "../dtos/request/credit-customer-request.dto";
import type { CreditCustomerResponseDto } from "../dtos/response/credit-customer-response.dto";
import api from "./api";

export const CreditCustomerService = {
  create: async (dto: CreditCustomerRequestDto) => {
    const response = await api.post<CreditCustomerResponseDto>("/credit-customer", dto);
    return response.data;
  },

  findOne: async (id: string, companyId: string): Promise<CreditCustomerResponseDto> => {
    const response = await api.get<CreditCustomerResponseDto>(`/credit-customer/companyId/${companyId}/${id}`);
    return response.data;
  },

  findAll: async (companyId: string): Promise<CreditCustomerResponseDto[]> => {
    const response = await api.get<CreditCustomerResponseDto[]>(`/credit-customer/${companyId}`);
    return response.data;
  },
};
