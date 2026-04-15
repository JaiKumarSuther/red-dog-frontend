"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type AdminUser = {
  _id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type AdminAuthContextType = {
  user: AdminUser | null;
  token: string | null;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AdminUser) => void;
  isAuthenticated: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const TOKEN_KEY = "rdg_admin_token";
const USER_KEY = "rdg_admin_user";

const setAdminCookie = (token: string) => {
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}`;
};

const clearAdminCookie = () => {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
};

const clearAgencySession = () => {
  localStorage.removeItem("rdg_token");
  localStorage.removeItem("rdg_user");
  document.cookie = "rdg_token=; path=/; max-age=0";
  document.cookie = "rdg_onboarding=; path=/; max-age=0";
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      const t = localStorage.getItem(TOKEN_KEY);
      if (u && t) {
        const parsed = JSON.parse(u) as AdminUser;
        if (parsed.role === "admin") {
          setUser(parsed);
          setToken(t);
        } else {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          clearAdminCookie();
        }
      }
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      clearAdminCookie();
    }
  }, []);

  const login = useCallback((nextUser: AdminUser, nextToken: string) => {
    if (nextUser.role !== "admin") return;
    clearAgencySession();
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, nextToken);
    setAdminCookie(nextToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearAdminCookie();
  }, []);

  const updateUser = useCallback((nextUser: AdminUser) => {
    if (nextUser.role !== "admin") return;
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && user?.role === "admin",
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
};
