import { Router, type IRouter, type Request, type Response } from "express";
import passport from "passport";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

router.post("/auth/login", (req: Request, res: Response, next) => {
  passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
    if (err) {
      next(err);
      return;
    }
    if (!user) {
      res.status(401).json({ error: info?.message ?? "Invalid credentials" });
      return;
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        next(loginErr);
        return;
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        created_at: (user as any).created_at,
      });
    });
  })(req, res, next);
});

router.post("/auth/logout", (req: Request, res: Response, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, (req: Request, res: Response): void => {
  const user = req.user!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id,
    created_at: (user as any).created_at,
  });
});

export default router;
