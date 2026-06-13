import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStorage } from "./api";

export type Role = "user" | "builder" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  verified: boolean;
  company_name?: string | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string, role: Role) => Promise<User>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await tokenStorage.get();
      if (t) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch {
          await tokenStorage.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await tokenStorage.set(res.data.access_token);
    setUser(res.data.user);
    return res.data.user as User;
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string, role: Role) => {
      const res = await api.post("/auth/signup", { email, password, name, role });
      await tokenStorage.set(res.data.access_token);
      setUser(res.data.user);
      return res.data.user as User;
    },
    [],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
