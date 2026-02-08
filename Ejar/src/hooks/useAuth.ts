import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const { user, accessToken, login, logout, loadUserFromToken, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) {
      loadUserFromToken();
    }
  }, [accessToken, user, loadUserFromToken]);

  const reloadUser = useCallback(async () => {
    if (accessToken) {
      await loadUserFromToken();
    }
  }, [accessToken, loadUserFromToken]);

  const isAuthenticated = !!(user && accessToken);

  return { user, accessToken, login, logout, isLoading, error, isAuthenticated, reloadUser };
};
