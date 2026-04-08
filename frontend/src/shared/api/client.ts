import axios from "axios";
import { getStoredToken } from "@/shared/auth/session";

const api = axios.create({
  baseURL: "http://backend-flow.test/api/v1",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) 
    config.headers.Authorization = `Bearer ${token}`;
  

  return config;
});

export default api;
export { api };
