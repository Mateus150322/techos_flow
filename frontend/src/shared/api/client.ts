import axios from "axios";
import { clearSession, getStoredToken } from "@/shared/auth/session";

const configuredApiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/+$/,
  ""
);

const apiBaseUrl =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : "/api/v1";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");
    const hasToken = Boolean(getStoredToken());

    if (hasToken && status === 401 && !requestUrl.includes("/login")) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };
