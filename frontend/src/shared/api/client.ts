import axios from "axios";

const api = axios.create({
  baseURL: "http://backend-flow.test/api/v1",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) 
    config.headers.Authorization = `Bearer ${token}`;
  

  return config;
});

export default api;
export { api };