import { prisma } from "@/lib/prisma";
import { decryptString, encryptString, maskToken } from "@/lib/crypto";
import { HttpError } from "@/lib/http-error";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";

export async function validateTbankToken(token: string) {
  const api = createTinkoffApi(token);
  const response = await api.users.getAccounts({});
  return response.accounts ?? [];
}

export async function saveUserTbankToken(userId: string, token: string) {
  await validateTbankToken(token);

  const connection = await prisma.tbankConnection.upsert({
    where: { userId },
    update: {
      tokenEncrypted: encryptString(token),
      tokenMasked: maskToken(token),
      isValid: true,
      lastCheckedAt: new Date(),
    },
    create: {
      userId,
      tokenEncrypted: encryptString(token),
      tokenMasked: maskToken(token),
      isValid: true,
      lastCheckedAt: new Date(),
    },
  });

  return connection;
}

export async function removeUserTbankToken(userId: string) {
  await prisma.tbankConnection.deleteMany({
    where: { userId },
  });
}

export async function getUserTbankToken(userId: string) {
  const connection = await prisma.tbankConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new HttpError(403, "Сначала подключи T-Bank токен в настройках");
  }

  return decryptString(connection.tokenEncrypted);
}
