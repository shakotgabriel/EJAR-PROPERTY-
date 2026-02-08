import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import API, { attachAuthInterceptors } from "@/api/api";
import type { AxiosRequestConfig } from "axios";

interface UserProfile {
  company_name?: string | null;
  background_check_status?: string;
  properties_count?: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  address?: string | null;
  profile_picture?: string | null;
  bio?: string | null;
  role: "admin" | "agent" | "landlord" | "tenant";
  is_verified: boolean;
  date_joined: string;
  profile?: UserProfile;
}

interface JWTPayload {
  user_id: number;
  exp: number;
  user?: User; // Optional if backend includes it
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      errors?: Record<string, unknown> | string[];
    };
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;
  clearSession: () => void;
  register: (
    email: string,
    first_name: string,
    last_name: string,
    password: string,
    phone_number?: string,
    role?: string,
    verify_via?: "email" | "phone"
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromToken: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  setSession: (session: { access: string; refresh: string; user: User }) => void;
  clearError: () => void;
}

let refreshInFlight: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),

      clearSession: () => {
        set({ user: null, accessToken: null, refreshToken: null, error: null, isLoading: false })
      },

      loadUserFromToken: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        
        try {
          const decoded = jwtDecode<JWTPayload>(accessToken);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) return;
          }

          // If user data is in token, use it; otherwise fetch from API
          if (decoded.user) {
            set({ user: decoded.user });
          } else {
            // Fetch user profile from API using the /me/ endpoint
            const res = await API.get(`users/me/`);
            set({ user: res.data });
          }
        } catch (err) {
          console.error("Failed to load user from token", err);
          // Clear invalid token
          get().clearSession();
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          if (!refreshInFlight) {
            refreshInFlight = (async () => {
              try {
                const res = await API.post(
                  "users/token/refresh/",
                  { refresh: refreshToken },
                  ({ __skipAuthHeader: true, __skipAuthRefresh: true } as AxiosRequestConfig)
                );
                const access = res.data?.access as string | undefined;
                return access ?? null;
              } catch (err) {
                console.error("Token refresh failed", err);
                return null;
              }
            })().finally(() => {
              refreshInFlight = null;
            });
          }

          const access = await refreshInFlight;
          if (!access) {
            get().clearSession();
            return false;
          }

          set({ accessToken: access });
          await get().loadUserFromToken();
          return true;
        } catch {
          get().clearSession();
          return false;
        }
      },

      register: async (email, first_name, last_name, password, phone_number, role = "tenant", verify_via = "email") => {
        set({ isLoading: true, error: null });
        try {
          await API.post("users/register/", { 
            email, 
            first_name, 
            last_name, 
            password,
            phone_number,
            role,
            verify_via,
          });
          // Registration successful - user can now login
          set({ isLoading: false });
        } catch (err: unknown) {
          const errorObj = err as ApiErrorResponse;
          console.error("Registration error:", {
            status: errorObj.response?.status,
            data: errorObj.response?.data,
            message: errorObj.response?.data?.detail || errorObj.response?.data?.errors,
          });
          
          let errorMessage = "Registration failed";
          if (errorObj.response?.data?.errors) {
            const errors = errorObj.response.data.errors;
            if (typeof errors === 'object') {
              errorMessage = Object.values(errors).flat().join(", ");
            } else if (typeof errors === 'string') {
              errorMessage = errors;
            }
          } else if (errorObj.response?.data?.detail) {
            errorMessage = errorObj.response.data.detail;
          }
          
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        // Clear any existing tokens before login to avoid sending invalid tokens
        set({ accessToken: null, refreshToken: null, user: null });
        try {
          const res = await API.post(
            "users/login/",
            { email, password },
            ({ __skipAuthHeader: true, __skipAuthRefresh: true } as AxiosRequestConfig)
          );
          const { access, refresh, user } = res.data;
          
          // Use user data from login response directly
          set({ 
            accessToken: access, 
            refreshToken: refresh,
            user: user,
            isLoading: false 
          });
        } catch (err: unknown) {
          const errorObj = err as ApiErrorResponse;
          // Log full error for debugging
          console.error("Login error:", {
            status: errorObj.response?.status,
            data: errorObj.response?.data,
            message: errorObj.response?.data?.detail || errorObj.response?.data?.errors,
          });
          
          const errorMessage = 
            errorObj.response?.data?.detail || 
            (errorObj.response?.data?.errors ? JSON.stringify(errorObj.response.data.errors) : "Login failed");
          set({ error: errorMessage, isLoading: false });
          throw err; // Re-throw to allow UI to handle
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        set({ isLoading: true });
        
        try {
          if (refreshToken) {
            await API.post("users/logout/", { refresh: refreshToken });
          }
        } catch (err) {
          console.error("Logout API call failed", err);
          // Continue with local logout even if API fails
        } finally {
          set({ 
            user: null, 
            accessToken: null, 
            refreshToken: null,
            isLoading: false 
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      setSession: ({ access, refresh, user }) => {
        set({ accessToken: access, refreshToken: refresh, user });
      },

      clearError: () => set({ error: null }),
    }),
    { 
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Consider hydration complete only after we've attempted to load the user.
        const maybeLoad = state.accessToken && !state.user ? state.loadUserFromToken() : Promise.resolve();
        Promise.resolve(maybeLoad).finally(() => {
          state.setIsHydrated(true);
        });
      },
    }
  )
);

let authInterceptorsAttached = false
if (!authInterceptorsAttached) {
  authInterceptorsAttached = true
  attachAuthInterceptors({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setAccessToken: (token) => {
      useAuthStore.setState({ accessToken: token })
    },
    onAuthFailure: () => {
      useAuthStore.getState().clearSession()
    },
  })
}