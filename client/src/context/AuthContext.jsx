import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("chat_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("chat_user", JSON.stringify(data.user));
    localStorage.setItem("chat_token", data.token);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("chat_user", JSON.stringify(data.user));
    localStorage.setItem("chat_token", data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("chat_user");
    localStorage.removeItem("chat_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { API_URL };
