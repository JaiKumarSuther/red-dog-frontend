"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type AgencyUser = {
  _id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  onboardingCompleted: boolean;
  isVerified?: boolean;
  role?: string;
};

type AgencyAuthContextType = {
  user: AgencyUser | null;
  token: string | null;
  login: (user: AgencyUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AgencyUser) => void;
  isAuthenticated: boolean;
};

const AgencyAuthContext = createContext<AgencyAuthContextType | null>(null);

const TOKEN_KEY = "rdg_token";
const USER_KEY = "rdg_user";

const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("rdg_admin_token");
  localStorage.removeItem("rdg_admin_user");
  document.cookie = "rdg_admin_token=; path=/; max-age=0";
};

const getStoredUser = (): AgencyUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AgencyUser) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

const setAuthCookies = (token: string, onboardingCompleted: boolean) => {
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}`;
  document.cookie = `rdg_onboarding=${onboardingCompleted ? "1" : "0"}; path=/; max-age=${maxAge}`;
};

const clearAuthCookies = () => {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = "rdg_onboarding=; path=/; max-age=0";
};

export const AgencyAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    const t = getStoredToken();
    if (u?.role === "admin") {
      clearAdminSession();
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      clearAuthCookies();
      setUser(null);
      setToken(null);
      return;
    }
    if (u && u.isVerified === false) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      clearAuthCookies();
      setUser(null);
      setToken(null);
      return;
    }
    setUser(u);
    setToken(t);
  }, []);

  const login = useCallback((nextUser: AgencyUser, nextToken: string) => {
    if (nextUser.role === "admin") {
      return;
    }
    clearAdminSession();
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, nextToken);
    setAuthCookies(nextToken, nextUser.onboardingCompleted);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearAuthCookies();
  }, []);

  const updateUser = useCallback((nextUser: AgencyUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    const t = localStorage.getItem(TOKEN_KEY) ?? "";
    setAuthCookies(t, nextUser.onboardingCompleted);
  }, []);

  return (
    <AgencyAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && user != null && user.role !== "admin",
      }}
    >
      {children}
    </AgencyAuthContext.Provider>
  );
};

export const useAgencyAuth = () => {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error("useAgencyAuth must be used inside AgencyAuthProvider");
  return ctx;
};

/** @deprecated use useAgencyAuth — alias for existing imports */
export const useAuth = useAgencyAuth;
