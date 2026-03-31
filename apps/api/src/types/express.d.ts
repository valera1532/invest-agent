import type { AuthUser } from "@/types/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
