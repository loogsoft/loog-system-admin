import type { ProductStatusEnum } from "../dtos/enums/product-status.enum";
import type { PaginationResponseDto } from "../dtos/pagination/pagination-response.dto";
import type { ProductRequest } from "../dtos/request/product-request.dto";
import type { ProductResponse } from "../dtos/response/product-response.dto";
import api from "./api";

const API_URL = "/products";

type ProductFindAllParams = {
  page?: number;
  limit?: number;
};

type ProductListResponse =
  | ProductResponse[]
  | PaginationResponseDto<ProductResponse>;

function normalizeProductListResponse(
  data: ProductListResponse,
  params?: ProductFindAllParams,
): PaginationResponseDto<ProductResponse> {
  if (Array.isArray(data)) {
    return {
      data,
      total: data.length,
      limit: params?.limit ?? data.length,
      page: params?.page ?? 1,
      totalPage: 1,
    };
  }

  return data;
}

async function findAllPaginatedProducts(
  params?: ProductFindAllParams,
): Promise<PaginationResponseDto<ProductResponse>> {
  const response = await api.get<ProductListResponse>(API_URL, { params });
  return normalizeProductListResponse(response.data, params);
}

async function findAllProducts(
  params?: ProductFindAllParams,
): Promise<ProductResponse[]> {
  const firstPage = await findAllPaginatedProducts(params);

  if (params?.page || firstPage.totalPage <= 1) {
    return firstPage.data;
  }

  const pageSize = firstPage.limit || firstPage.data.length || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPage - 1 }, (_, index) =>
      findAllPaginatedProducts({
        ...params,
        page: index + 2,
        limit: pageSize,
      }),
    ),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((page) => page.data),
  ];
}

function appendFormValue(fd: FormData, key: string, value: unknown) {
  if (value === undefined) return;

  if (value === null) {
    if (key === "supplierId") fd.append(key, "");
    if (key === "promoPrice") fd.append(key, "null");
    return;
  }

  if (Array.isArray(value) || typeof value === "object") {
    fd.append(key, JSON.stringify(value));
    return;
  }

  fd.append(key, String(value));
}

export const ProductService = {
  findAll: findAllProducts,

  findAllPaginated: findAllPaginatedProducts,

  findOne: async (id: string): Promise<ProductResponse> => {
    const response = await api.get<ProductResponse>(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (
    product: ProductRequest,
    files?: File[],
  ): Promise<ProductResponse> => {
    const formData = new FormData();

    const { variations, ...productData } = product;
    const variationsForJson = variations?.map(({ images, ...rest }) => {
      void images;
      return rest;
    });

    Object.entries({ ...productData, variations: variationsForJson }).forEach(
      ([key, value]) => {
        appendFormValue(formData, key, value);
      },
    );

    if (files?.length) {
      files.forEach((file) => formData.append("files", file));
    }

    variations?.forEach((variation, index) => {
      if (
        variation.images &&
        variation.images.length > 0 &&
        variation.images[0] instanceof File
      ) {
        formData.append(`variationImage_${index}`, variation.images[0]);
      }
    });

    const response = await api.post<ProductResponse>(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  update: async (
    id: string,
    product: Partial<ProductRequest>,
    files?: File[],
  ): Promise<ProductResponse> => {
    const formData = new FormData();

    const { variations, ...productData } = product;
    const variationsForJson = variations?.map(({ images, ...rest }) => {
      void images;
      return rest;
    });

    Object.entries({ ...productData, variations: variationsForJson }).forEach(
      ([key, value]) => {
        appendFormValue(formData, key, value);
      },
    );

    if (files?.length) {
      files.forEach((file) => formData.append("files", file));
    }

    variations?.forEach((variation, index) => {
      if (
        variation.images &&
        variation.images.length > 0 &&
        variation.images[0] instanceof File
      ) {
        formData.append(`variationImage_${index}`, variation.images[0]);
      }
    });

    const response = await api.patch<ProductResponse>(
      `${API_URL}/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  actived: async (
    id: string,
    status: ProductStatusEnum,
  ): Promise<ProductResponse> => {
    const response = await api.patch<ProductResponse>(
      `${API_URL}/${id}/status`,
      { status },
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },
};
