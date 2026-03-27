export interface CreditCustomerResponseDto {
  id: string;
  comapnyId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  road: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  totalAmounts?: number;
  date: Date;
}
