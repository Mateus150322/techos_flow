import axios from "axios";
import { getStoredToken } from "@/shared/auth/session";

const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://backend-flow.test/api/v1";

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

export default api;
export { api };
