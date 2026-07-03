import type { ProductsCategoriesRequestDto } from "../dtos/request/products-categories-request.dto";
import type { ProductsCategoriesResponseDto } from "../dtos/response/products-categories-response.dto";
import api from "./api";

export const ProductsCategoriesService = {
  async create(
    data: ProductsCategoriesRequestDto,
  ): Promise<ProductsCategoriesResponseDto> {
    const response = await api.post<ProductsCategoriesResponseDto>(
      "/products-categories",
      data,
    );
    return response.data;
  },

  async findAll(): Promise<ProductsCategoriesResponseDto[]> {
    const response =
      await api.get<ProductsCategoriesResponseDto[]>("/products-categories");
    return response.data;
  },

  async findOne(id: string): Promise<ProductsCategoriesResponseDto> {
    const response = await api.get<ProductsCategoriesResponseDto>(
      `/products-categories/${id}`,
    );
    return response.data;
  },

  async update(
    id: string,
    data: ProductsCategoriesRequestDto,
  ): Promise<ProductsCategoriesResponseDto> {
    const response = await api.patch<ProductsCategoriesResponseDto>(
      `/products-categories/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/products-categories/${id}`);
  },
};
