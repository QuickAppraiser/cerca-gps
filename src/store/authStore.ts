// ==========================================
// CERCA - Store de Autenticación (Zustand)
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Driver, UserRole } from '../types';

interface AuthState {
  // Estado
  user: User | Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;

  // Acciones
  setUser: (user: User | Driver | null) => void;
  setActiveRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  updateCredits: (amount: number) => void;
  updateTokens: (amount: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      activeRole: 'passenger',

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        activeRole: user?.role === 'both' ? get().activeRole : (user?.role || 'passenger')
      }),

      setActiveRole: (activeRole) => set({ activeRole }),

      setLoading: (isLoading) => set({ isLoading }),

      updateCredits: (amount) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, credits: user.credits + amount } });
        }
      },

      updateTokens: (amount) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, tokens: user.tokens + amount } });
        }
      },

      logout: () => set({
        user: null,
        isAuthenticated: false,
        activeRole: 'passenger'
      }),
    }),
    {
      name: 'cerca-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeRole: state.activeRole
      }),
    }
  )
);
