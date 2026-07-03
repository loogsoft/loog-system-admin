import type { StockMovementResponseDto, StockMovementType } from "./stock-movement-response.dto";
import type { CreditSaleResponseDto } from "./credit-sale-response.dto";

export interface StockOperationResponseDto {
  id: string;
  companyId?: string;
  creditSaleId?: string;
  creditSale?: CreditSaleResponseDto;
  type: StockMovementType;
  reason: string;
  paymentMethod: string;
  responsibleName: string;
  responsibleEmail: string;
  observation?: string;
  movements: StockMovementResponseDto[];
  createdAt: Date;
}
