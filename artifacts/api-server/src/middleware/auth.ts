import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  job_title?: string | null;
  created_at?: Date | null;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

// Persona → seeded account email
const PERSONA_EMAILS: Record<string, string> = {
  admin: "admin@impacctbrooklyn.org",
  depthead: "jordan@impacctbrooklyn.org",
  staff: "stephanie@impacctbrooklyn.org",
};

/**
 * Reads the `persona` cookie and injects the matching database user into
 * req.user. Falls back to admin when no (or unknown) cookie is present.
 * This runs before every API request so sessions are never required.
 */
export async function injectPersonaUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // If Passport already set a user (manual login via /login), respect it
  if (req.user) { next(); return; }

  const persona = (req.cookies?.persona as string) || "admin";
  const email = PERSONA_EMAILS[persona] ?? PERSONA_EMAILS.admin;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        job_title: user.job_title,
        created_at: user.created_at,
      };
    }
  } catch {
    // If DB fails, continue without user — individual routes will handle it
  }

  next();
}

/** No-op: authentication is handled by injectPersonaUser above. */
export function requireAuth(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}

/** Still enforce admin role so the UI role-gating works correctly. */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
