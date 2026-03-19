import type { UserTypeEnum } from "../enums/user-type.enum";

export interface UserRequestDto {
  name: string;
  companyId: string;
  email: string;
  password: string;
  userType: UserTypeEnum;
}
