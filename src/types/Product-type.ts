import type { ProductStatusEnum } from "../dtos/enums/product-status.enum";

export type CategoryKey = string;

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryLabel: string;
  categoryKey: Exclude<CategoryKey, "all">;
  price: number;
  imageUrl: string;
  inStock: ProductStatusEnum;
  available: boolean;
}
