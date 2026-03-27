import { createContext } from "react";
import type { UserTypeEnum } from "../dtos/enums/user-type.enum";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    companyId: string;
    userType: UserTypeEnum;
  } | null;
};

const AuthContext = createContext({} as AuthContextType);

export type { AuthContextType };
export { AuthContext };
