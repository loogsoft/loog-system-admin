import type { ProductStatusEnum } from "../enums/product-status.enum";
import type { ProductVariationRequestDto } from "./product-variation-request.dto";
import type { ProductsCategoriesRequestDto } from "./products-categories-request.dto";

export interface ProductRequest {
  barCode?: string;
  name: string;
  description?: string;
  category: ProductsCategoriesRequestDto;
  status?: ProductStatusEnum;
  price?: number | null;
  color?: string | null;
  size?: string | null;
  promoPrice?: number | null;
  stock?: number | null;
  activeLowStock?: boolean;
  lowStock?: number;
  variations?: ProductVariationRequestDto[];
  imageIds?: string[];
  supplierId?: string | null;
}
