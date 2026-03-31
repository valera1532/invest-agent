import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-error";
import { hashToken } from "@/lib/crypto";
import { env } from "@/config/env";
import type { AuthUser } from "@/types/auth";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function mapUser(user: { id: string; email: string; name: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new HttpError(409, "Пользователь с таким email уже существует");
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  return mapUser(user);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new HttpError(401, "Неверный email или пароль");
  }

  const isValidPassword = await argon2.verify(user.passwordHash, input.password);
  if (!isValidPassword) {
    throw new HttpError(401, "Неверный email или пароль");
  }

  return mapUser(user);
}

export async function createRefreshSession(userId: string, userAgent?: string, ipAddress?: string) {
  const refreshToken = randomBytes(48).toString("hex");
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      expiresAt,
    },
  });

  return refreshToken;
}

export async function rotateRefreshSession(refreshToken: string, userAgent?: string, ipAddress?: string) {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, "Сессия истекла, войди заново");
  }

  await prisma.session.delete({ where: { id: session.id } });
  const nextRefreshToken = await createRefreshSession(session.userId, userAgent, ipAddress);

  return {
    user: mapUser(session.user),
    refreshToken: nextRefreshToken,
  };
}

export async function revokeRefreshSession(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashToken(refreshToken),
    },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tbankConnection: true },
  });

  if (!user) {
    throw new HttpError(404, "Пользователь не найден");
  }

  return {
    ...mapUser(user),
    hasTbankToken: Boolean(user.tbankConnection),
    tbankTokenMasked: user.tbankConnection?.tokenMasked ?? null,
  };
}
