import type { ProductCategoryEnum } from "../enums/product-category.enum";
import type { ProductStatusEnum } from "../enums/product-status.enum";
import type { ProductVariationRequestDto } from "./product-variation-request.dto";

export interface ProductRequest {
  name: string;
  description?: string;
  companyId: string;
  category: ProductCategoryEnum;
  status?: ProductStatusEnum;
  price: number | null;
  color?: string | undefined;
  size?: string | undefined;
  promoPrice?: number | null;
  stock?: number | null;
  hasVariations: boolean;
  activeLowStock: boolean;
  lowStock: number;
  variations?: ProductVariationRequestDto[];
  imageIds?: string[];
  supplierId: string;
}
