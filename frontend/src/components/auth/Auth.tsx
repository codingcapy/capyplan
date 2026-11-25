import { useEffect } from "react";
import useAuthStore from "../../store/AuthStore";

export default function Auth({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const tokenLoading = useAuthStore((s) => s.tokenLoading);

  useEffect(() => {
    localStorage.removeItem("jwt_access_token");
    restoreSession();
  }, []);

  return <div>{tokenLoading ? "" : children}</div>;
}
