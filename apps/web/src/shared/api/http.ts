import axios from "axios";
import ky from "ky";

function resolveApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "";
}

export const axiosClient = axios.create({
  baseURL: "/",
  timeout: 10_000,
});

export const backendAxiosClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10_000,
});

export const kyClient = ky.create({
  prefixUrl: "",
  timeout: 10_000,
});

export const backendKyClient = ky.create({
  prefixUrl: resolveApiBaseUrl(),
  timeout: 10_000,
});
