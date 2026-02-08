// src/api/api.ts
import axios, { type AxiosRequestConfig } from "axios"

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined)

const API = axios.create({
  baseURL: (API_BASE_URL ?? "https://ejar-property.onrender.com/api/").replace(/\/+$/, "") + "/",
  headers: { Accept: "application/json" },
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete API.defaults.headers.common.Authorization
  }
}

type AuthInterceptorCallbacks = {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setAccessToken: (token: string | null) => void
  onAuthFailure: () => void
}

type AxiosConfigWithAuthFlags = {
  __skipAuthHeader?: boolean
  __skipAuthRefresh?: boolean
  _retry?: boolean
}

const AUTH_ENDPOINTS = [
  "users/login/",
  "users/register/",
  "users/token/refresh/",
  "users/password-reset/",
  "users/password-reset-confirm/",
  "users/verify/start/",
  "users/verify/confirm/",
]

const normalizeUrl = (url?: string) => {
  if (!url) return ""
  // Axios may store relative paths (e.g. 'users/me/') or absolute URLs.
  return url.replace(/^https?:\/\/[^/]+\//i, "").replace(/^\/+/, "")
}

const isAuthEndpoint = (url?: string) => {
  const normalized = normalizeUrl(url)
  return AUTH_ENDPOINTS.some((p) => normalized.includes(p))
}

let refreshPromise: Promise<string | null> | null = null
let interceptorsAttached = false

export const attachAuthInterceptors = (callbacks: AuthInterceptorCallbacks) => {
  if (interceptorsAttached) return
  interceptorsAttached = true

  API.interceptors.request.use(
    (config) => {
      const cfg = config as typeof config & AxiosConfigWithAuthFlags
      if (cfg.__skipAuthHeader) return config

      if (!isAuthEndpoint(cfg.url)) {
        const token = callbacks.getAccessToken()
        if (token) {
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`
        }
      }

      return config
    },
    (error) => Promise.reject(error)
  )

  API.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as (typeof error.config & AxiosConfigWithAuthFlags) | undefined
      const status = error.response?.status

      if (!originalRequest || status !== 401) {
        return Promise.reject(error)
      }

      if (originalRequest.__skipAuthRefresh) {
        return Promise.reject(error)
      }

      // Never try to refresh for auth endpoints (especially refresh itself), or we risk loops.
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        callbacks.onAuthFailure()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      const refreshToken = callbacks.getRefreshToken()
      if (!refreshToken) {
        callbacks.onAuthFailure()
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const res = await API.post(
                "users/token/refresh/",
                { refresh: refreshToken },
                ({ __skipAuthHeader: true, __skipAuthRefresh: true } as AxiosRequestConfig & AxiosConfigWithAuthFlags)
              )
              const access = res.data?.access as string | undefined
              if (!access) return null
              callbacks.setAccessToken(access)
              return access
            } catch {
              return null
            }
          })().finally(() => {
            refreshPromise = null
          })
        }

        const newAccessToken = await refreshPromise
        if (!newAccessToken) {
          callbacks.onAuthFailure()
          return Promise.reject(error)
        }

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return API(originalRequest)
      } catch (refreshError) {
        callbacks.onAuthFailure()
        return Promise.reject(refreshError)
      }
    }
  )
}

export default API
