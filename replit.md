# IMPACCT Brooklyn — Content Submission Portal

## Overview

Internal staff portal for IMPACCT Brooklyn. Handles content submission workflow, shared resource directory, and admin controls for users, departments, and categories.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Auth**: Passport.js (Local Strategy / bcryptjs) — Google OAuth-ready (google_id column in schema)
- **Sessions**: express-session + connect-pg-simple (stored in PostgreSQL)
- **Email**: Nodemailer (`artifacts/api-server/src/mailer.ts`) — placeholder transporter until SMTP is configured
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for server), Vite (React frontend)

## Structure

```text
/
├── artifacts/
│   ├── api-server/         # Express API server (auth, all routes)
│   └── portal/             # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/
    └── src/seed.ts         # Database seed script
```

## Database Schema

Tables: `departments`, `users`, `submissions`, `status_history`, `resources`, `resource_categories`, `session`

## Default Admin Credentials

- Email: `admin@impacctbrooklyn.org`
- Password: `Admin1234!`

Change this password immediately via Admin → Users after first login.

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string (provisioned by Replit)
- `SESSION_SECRET` — Secure random string for session signing

Optional (email notifications):
- `EMAIL_HOST` — SMTP server hostname
- `EMAIL_PORT` — SMTP port (default: 587)
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `EMAIL_FROM` — From address (default: noreply@impacctbrooklyn.org)

## Roles

| Role | Capabilities |
|------|-------------|
| `admin` | Full access — manage users, departments, all submissions, approve categories, change statuses |
| `department_head` | View/create submissions for own department, view resources |
| `staff` | Create submissions, view resources only |

## Key Commands

```bash
# Run seed script (creates departments, categories, default admin)
pnpm --filter @workspace/scripts run seed

# Push DB schema changes
pnpm --filter @workspace/db run push

# Run codegen after OpenAPI spec changes
pnpm --filter @workspace/api-spec run codegen

# Dev server (API)
pnpm --filter @workspace/api-server run dev

# Dev server (Portal frontend)
pnpm --filter @workspace/portal run dev
```

## Email Configuration

The mailer is in `artifacts/api-server/src/mailer.ts`. When no SMTP credentials are set, emails are logged to console instead of being sent. To connect a mail provider, set the EMAIL_* environment variables — no code changes needed.

## Google OAuth Readiness

The `users` table has a `google_id` column. Auth is implemented via Passport.js Local Strategy. To add Google OAuth, add `passport-google-oauth20` strategy to `artifacts/api-server/src/app.ts` without rewriting the session/auth flow.
