import { useContext } from "react";
import { AuthContext, AuthContextValue } from "../contexts/AuthContext";

export function useAuthContext(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  }
  return contexto;
}
