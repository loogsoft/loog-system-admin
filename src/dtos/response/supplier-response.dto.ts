import type { SupplierStatus } from "../request/supplier-request.dto";
import type { ProductResponse } from "./product-response.dto";

export interface SupplierResponseDto {
  id: string;
  name: string;
  category?: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: SupplierStatus;
  linkSite?: string;
  imageUrl?: string[] | string;
  avatarColor?: string;
  openOrders?: number;
  products?: ProductResponse[];
  images?: { id?: string; url: string; publicId?: string }[];
}
