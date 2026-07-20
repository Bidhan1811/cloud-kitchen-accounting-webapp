"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthState } from "@/types/auth.types";

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isOwner: false,
    isAdmin: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("rr_token");
    const userRaw = localStorage.getItem("rr_user");
    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        setState({
          user,
          token,
          isAuthenticated: true,
          isOwner: user.role === "owner",
          isAdmin: user.role === "owner" || user.role === "admin",
        });
      } catch {
        localStorage.removeItem("rr_token");
        localStorage.removeItem("rr_user");
      }
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("rr_token", token);
    localStorage.setItem("rr_user", JSON.stringify(user));
    setState({
      user,
      token,
      isAuthenticated: true,
      isOwner: user.role === "owner",
      isAdmin: user.role === "owner" || user.role === "admin",
    });
  };

  const logout = () => {
    localStorage.removeItem("rr_token");
    localStorage.removeItem("rr_user");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isOwner: false,
      isAdmin: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
