export interface ProductVariationRequestDto {
  name: string;
  price?: number;
  stock: number;
  isActive?: boolean;
  color: string;
  size: string;
  images?: File[];
  lowStock: number;
}
