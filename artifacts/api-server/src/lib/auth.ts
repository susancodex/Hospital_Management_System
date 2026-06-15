import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production. Set it via Replit Secrets.");
    }
    // Development-only fallback — NOT for production use.
    console.warn("[SECURITY] JWT_SECRET not set. Using insecure dev fallback. Set JWT_SECRET in Secrets for any real deployment.");
    return "dev-only-insecure-fallback-set-JWT_SECRET-in-secrets";
  }
  if (secret.length < 32) {
    console.warn("[SECURITY] JWT_SECRET is too short (< 32 chars). Use a long random string.");
  }
  return secret;
})();

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateTokens(user: AuthUser) {
  const access = jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
  const refresh = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { access, refresh };
}

export function verifyToken(token: string): { sub: number; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: number; username: string; role: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Authentication credentials were not provided." });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ detail: "Token is invalid or expired." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(payload.sub)));
  if (!user) {
    res.status(401).json({ detail: "User not found." });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ detail: "Account is deactivated." });
    return;
  }
  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ detail: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ detail: `Access denied. Required role: ${roles.join(" or ")}.` });
      return;
    }
    next();
  };
}

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
    phone: user.phone,
    profile_picture: user.profilePicture,
    is_active: user.isActive,
  };
}
