import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { notifySessionExpired } from "@/features/auth/lib/session-events";

function resolveApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "";
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 300_000,
  withCredentials: true,
});

const authClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 300_000,
  withCredentials: true,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshRequest: Promise<void> | null = null;

function isAuthRoute(url?: string) {
  return Boolean(url?.startsWith("/api/auth/"));
}

async function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = authClient
      .post("/api/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const statusCode = error.response?.status;
    const requestConfig = error.config as RetriableRequestConfig | undefined;

    if (
      !requestConfig ||
      statusCode !== 401 ||
      requestConfig._retry ||
      isAuthRoute(requestConfig.url)
    ) {
      return Promise.reject(error);
    }

    requestConfig._retry = true;

    try {
      await refreshAuthSession();
      return apiClient(requestConfig);
    } catch {
      try {
        await authClient.post("/api/auth/logout");
      } catch {
        // Ignore logout errors after refresh failure.
      }

      notifySessionExpired();
      return Promise.reject(error);
    }
  },
);
