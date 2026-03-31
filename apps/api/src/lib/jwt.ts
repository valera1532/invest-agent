import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import type { AccessTokenPayload, AuthUser } from "@/types/auth";

const accessTokenExpiresIn = env.ACCESS_TOKEN_TTL as NonNullable<jwt.SignOptions["expiresIn"]>;

export function signAccessToken(user: AuthUser) {
  const options: jwt.SignOptions = {
    subject: user.id,
    expiresIn: accessTokenExpiresIn,
  };

  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      type: "access",
    },
    env.ACCESS_TOKEN_SECRET,
    options,
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}
