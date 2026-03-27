import type { ProductCategoryEnum } from "../enums/product-category.enum";
import type { ProductStatusEnum } from "../enums/product-status.enum";
import type { ImageResponse } from "./image-response.dto";
import type { ProductVariationResponseDto } from "./product-variation-response.dto";

export interface ProductResponse {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: ProductCategoryEnum;
  price: number;
  color?: string;
  size?: string;
  promoPrice?: number;
  status?: ProductStatusEnum;
  activeLowStock: boolean;
  stock?: number;
  lowStock: number;
  images: ImageResponse[];
  variations?: ProductVariationResponseDto[];
  createdAt: string;
  updatedAt: string;
}
