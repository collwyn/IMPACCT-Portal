import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, pool } from "@workspace/db";
import { injectPersonaUser } from "./middleware/auth.js";
import router from "./routes/index.js";

const PgSession = connectPgSimple(session);

if (!process.env["SESSION_SECRET"]) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const app: Express = express();

// Trust Replit's reverse proxy so secure cookies work over HTTPS in production
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env["SESSION_SECRET"],
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return done(null, false, { message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return done(null, false, { message: "Invalid email or password" });
      }

      return done(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        job_title: user.job_title,
        created_at: user.created_at,
      });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, (user as { id: number }).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!user) {
      return done(null, false);
    }

    done(null, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      job_title: user.job_title,
      created_at: user.created_at,
    });
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Inject persona user from cookie so all routes work without a login session
app.use(injectPersonaUser);

app.use("/api", router);

export default app;
