import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/config/env";

const algorithm = "aes-256-gcm";
const key = createHash("sha256").update(env.TOKEN_ENCRYPTION_KEY).digest();

export function encryptString(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptString(payload: string) {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted payload format");
  }

  const decipher = createDecipheriv(algorithm, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function maskToken(value: string) {
  if (value.length <= 10) {
    return `${value.slice(0, 3)}***`;
  }

  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}
