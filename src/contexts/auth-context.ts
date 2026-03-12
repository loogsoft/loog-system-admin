import { createContext } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  user: { 
    id: string;
    name?: string;
    email?: string;
  } | null;
};

const AuthContext = createContext({} as AuthContextType);

export type { AuthContextType };
export { AuthContext };
