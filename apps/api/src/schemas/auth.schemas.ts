import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Некорректный email").trim().toLowerCase(),
  password: z.string().min(8, "Пароль должен быть минимум 8 символов"),
  name: z.string().min(2, "Укажи имя"),
});

export const loginSchema = z.object({
  email: z.email("Некорректный email").trim().toLowerCase(),
  password: z.string().min(8, "Пароль должен быть минимум 8 символов"),
});

export const connectTbankSchema = z.object({
  token: z.string().min(20, "Токен выглядит слишком коротким"),
});
