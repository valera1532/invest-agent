import { apiClient } from "@/shared/api/http";

export type AuthProfile = {
  id: string;
  email: string;
  name: string;
  hasTbankToken: boolean;
  tbankTokenMasked: string | null;
  hasCompletedInvestorQuiz: boolean;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await apiClient.post<AuthProfile>(
    "/api/auth/register",
    payload,
  );
  return response.data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiClient.post<AuthProfile>(
    "/api/auth/login",
    payload,
  );
  return response.data;
}

export async function refreshSession() {
  const response = await apiClient.post<AuthProfile>("/api/auth/refresh");
  return response.data;
}

export async function logoutUser() {
  await apiClient.post("/api/auth/logout");
}

export async function getCurrentUser() {
  const response = await apiClient.get<AuthProfile>("/api/auth/me");
  return response.data;
}

export async function connectTbankToken(token: string) {
  const response = await apiClient.post<{
    ok: true;
    tokenMasked: string;
    lastCheckedAt: string;
  }>("/api/auth/tbank/connect", { token });
  return response.data;
}

export async function disconnectTbankToken() {
  await apiClient.delete("/api/auth/tbank/disconnect");
}
