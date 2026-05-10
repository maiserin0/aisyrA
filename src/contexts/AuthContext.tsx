"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "../lib/firebase";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  authError: string;
  login: () => Promise<void>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check for errors from redirect
    getRedirectResult(auth).catch((e) => {
      console.error("Redirect login error:", e);
      setAuthError(`Ошибка редиректа: ${e.code || e.message}`);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setAuthError("");
      await loginWithGoogle();
    } catch (e: unknown) {
      const code =
        typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string"
          ? ((e as any).code as string)
          : undefined;
      // Most common on Vercel: auth/unauthorized-domain
      const message =
        code === "auth/unauthorized-domain"
          ? "Домен не разрешён в Firebase Auth (Authorized domains)."
          : code === "auth/popup-blocked"
          ? "Браузер заблокировал popup. Разреши всплывающие окна."
          : code === "auth/popup-closed-by-user"
          ? "Окно входа было закрыто."
          : code
          ? `Ошибка входа: ${code}`
          : "Ошибка входа через Google.";

      setAuthError(message);
      console.error("Login failed:", e);
    }
  };

  const logoutUser = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
