import type { ProductVariationResponseDto } from "./product-variation-response.dto";

export type StockMovementType = "IN" | "OUT";

export interface StockMovementResponseDto {
  id: string;
  productName: string;
  companyId: string;
  variation: ProductVariationResponseDto;
  quantity: number;
  price: string;
  type: StockMovementType;
  reason: string;
  paymentMethod: string;
  responsibleName: string;
  responsibleEmail: string;
  observation?: string;
  createdAt: Date;
}
