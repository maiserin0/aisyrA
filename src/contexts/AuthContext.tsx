"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "../lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const logoutUser = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
