import type { ProductStatusEnum } from "../enums/product-status.enum";
import type { ImageResponse } from "./image-response.dto";
import type { ProductVariationResponseDto } from "./product-variation-response.dto";
import type { SupplierResponseDto } from "./supplier-response.dto";

export interface ProductResponse {
  id: string;
  barCode?: string;
  name: string;
  description?: string;
  category: string;
  price: number | string | null;
  color?: string;
  size?: string;
  promoPrice?: number | string | null;
  status?: ProductStatusEnum;
  activeLowStock: boolean;
  stock?: number | null;
  lowStock: number;
  images: ImageResponse[];
  variations?: ProductVariationResponseDto[];
  supplier?: SupplierResponseDto;
  createdAt: string;
  updatedAt: string;
}
