import React, { createContext, useContext, useEffect, useState } from "react";

const APP_PASSWORD =
  import.meta.env.VITE_LOGIN_PASSWORD ||
  process.env.REACT_APP_LOGIN_PASSWORD;

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    setIsAuthenticated(loggedIn);
  }, []);

  const login = (password: string): boolean => {
    if (password === APP_PASSWORD) {
      localStorage.setItem("loggedIn", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = (): void => {
    localStorage.removeItem("loggedIn");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
