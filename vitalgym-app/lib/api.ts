// lib/api.ts
import axios from "axios";
import { getToken } from "./auth";

// ⚠️ CAMBIA ESTO a tu dominio/IP del backend
const BASE_URL = "https://vitalgym.fit/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const apiAuth = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

apiAuth.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

