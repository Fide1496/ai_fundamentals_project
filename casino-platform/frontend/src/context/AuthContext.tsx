import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../utils/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('casino_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        // Refresh balance on mount
        api.getWallet()
          .then(({ balance }) => {
            setUser(u => u ? { ...u, balance } : null);
          })
          .catch(() => {
            // Token expired
            localStorage.removeItem('casino_user');
            localStorage.removeItem('casino_token');
            setUser(null);
          });
      } catch {
        localStorage.removeItem('casino_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    const userData: User = {
      userId: data.userId,
      username: data.username,
      token: data.token,
      balance: data.balance,
    };
    localStorage.setItem('casino_token', data.token);
    localStorage.setItem('casino_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (username: string, password: string) => {
    const data = await api.register(username, password);
    const userData: User = {
      userId: data.userId,
      username: data.username,
      token: data.token,
      balance: data.balance,
    };
    localStorage.setItem('casino_token', data.token);
    localStorage.setItem('casino_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('casino_token');
    localStorage.removeItem('casino_user');
    setUser(null);
  };

  const updateBalance = useCallback((balance: number) => {
    setUser(u => {
      if (!u) return null;
      const updated = { ...u, balance };
      localStorage.setItem('casino_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    const { balance } = await api.getWallet();
    updateBalance(balance);
  }, [updateBalance]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBalance, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
