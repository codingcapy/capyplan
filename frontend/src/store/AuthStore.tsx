import axios from "axios";
import { create } from "zustand";
import { type User } from "@server/schemas/users";
import { setSession, refreshSession } from "../services/jwt.service";

export type SafeUser = Omit<User, "password">;

const API_BASE = import.meta.env.DEV
  ? "http://localhost:3333"
  : window.location.origin;

const useAuthStore = create<{
  user: SafeUser | null;
  authLoading: boolean;
  tokenLoading: boolean;
  setUser: (args: SafeUser) => void;
  clearAuth: () => void;
  logoutService: () => void;
  loginService: (email: string, password: string) => void;
  restoreSession: () => Promise<void>;
}>((set, get) => ({
  user: null,
  authLoading: false,
  tokenLoading: true,
  setUser: (args) => set({ user: args }),
  // Local-only reset (does not touch the cookie).
  clearAuth: () => {
    setSession(null);
    set({ user: null, authLoading: false, tokenLoading: false });
  },
  // Explicit logout: ends this device's session on the server too.
  logoutService: () => {
    axios
      .post(`${API_BASE}/api/v0/user/logout`, null, { withCredentials: true })
      .catch((err) => console.log(err));
    get().clearAuth();
  },
  loginService: async (email, password) => {
    set({ authLoading: true });
    try {
      const res = await axios.post(
        `${API_BASE}/api/v0/user/login`,
        { email, password },
        { withCredentials: true },
      );
      if (res.data.result?.user && res.data.result?.token) {
        setSession(res.data.result.token);
        set({ user: res.data.result.user, authLoading: false });
      } else {
        set({ authLoading: false, user: null });
      }
    } catch (err) {
      console.log(err);
      set({ authLoading: false });
    }
  },
  restoreSession: async () => {
    const result = await refreshSession();
    if (result) {
      set({ user: result.user, tokenLoading: false });
    } else {
      get().clearAuth();
    }
  },
}));

export default useAuthStore;
