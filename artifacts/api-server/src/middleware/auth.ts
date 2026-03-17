import { Request, Response, NextFunction } from "express";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
