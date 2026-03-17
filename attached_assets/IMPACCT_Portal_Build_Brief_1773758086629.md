# IMPACCT Brooklyn — Content Submission Portal
## Technical Build Brief

---

## Stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (not SQLite)
- **Auth:** Session-based with bcrypt password hashing; architecture must support Google OAuth addition without login system rewrite
- **File handling:** None — attachments are stored as URL strings only, no file upload functionality
- **Email:** Nodemailer with transporter abstraction layer — provider must be swappable without refactoring notification logic
- **Deployment target:** Kinsta/Sevalla — all credentials via environment variables, no hardcoded secrets
- **Dev environment:** Replit

---

## Environment Variables

```
DATABASE_URL=
SESSION_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
PORT=
```

---

## Database Schema

### Table: departments

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  contact_email VARCHAR(150),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'department_head', 'staff')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  google_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: submissions

```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL CHECK (
    content_type IN ('event', 'program_update', 'staff_change', 'resource', 'news')
  ),
  headline VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  link VARCHAR(500),
  attachment_url VARCHAR(500),
  requested_publish_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'published', 'needs_revision')
  ),
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
```

### Table: status_history

```sql
CREATE TABLE status_history (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: resource_categories

```sql
CREATE TABLE resource_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'pending')
  ),
  suggested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: resources

```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES resource_categories(id),
  description TEXT,
  url VARCHAR(500),
  login_info_location VARCHAR(255),
  access_level VARCHAR(30) DEFAULT 'everyone' CHECK (
    access_level IN ('everyone', 'department', 'leadership')
  ),
  cost VARCHAR(100),
  renewal_date DATE,
  added_by INTEGER NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Seed Data

### departments

```sql
INSERT INTO departments (name) VALUES
  ('Housing'),
  ('Small Business'),
  ('Homeowner Services'),
  ('Tenant Organizing'),
  ('Commercial Development'),
  ('Administration'),
  ('Communications');
```

### resource_categories

```sql
INSERT INTO resource_categories (name, status) VALUES
  ('SaaS Tools & Software Subscriptions', 'active'),
  ('External Platforms & Social Accounts', 'active'),
  ('Grants & Funding Sources', 'active'),
  ('Partner Organizations & Contacts', 'active'),
  ('Government Programs & Resources', 'active'),
  ('Physical Assets & Vendor Accounts', 'active');
```

---

## API Routes

### Auth

```
POST   /api/auth/login          — email + password, sets session
POST   /api/auth/logout         — destroys session
GET    /api/auth/me             — returns current session user
```

### Users (admin only)

```
GET    /api/users               — list all users
POST   /api/users               — create user
PATCH  /api/users/:id           — update user
DELETE /api/users/:id           — delete user
```

### Departments (admin only)

```
GET    /api/departments         — list all departments
POST   /api/departments         — create department
PATCH  /api/departments/:id     — update department
```

### Submissions

```
GET    /api/submissions                    — admin: all | department_head: own dept only
POST   /api/submissions                    — create submission (department_head, staff)
GET    /api/submissions/:id                — get single submission
PATCH  /api/submissions/:id/status         — admin only: update status + admin_notes
                                             auto-writes to status_history
                                             triggers email notification to submitter
```

### Resources

```
GET    /api/resources                      — all users: list active resources
POST   /api/resources                      — all users: add resource (immediate, no approval)
PATCH  /api/resources/:id                  — admin only: edit resource
DELETE /api/resources/:id                  — admin only: archive resource
```

### Resource Categories

```
GET    /api/resource-categories            — all users: list active categories only
POST   /api/resource-categories/suggest    — all users: submit new category (status: pending)
GET    /api/resource-categories/pending    — admin only: list pending categories
PATCH  /api/resource-categories/:id/approve — admin only: set status to active, set approved_by
DELETE /api/resource-categories/:id        — admin only
```

---

## Auth Middleware

```javascript
// requireAuth — rejects unauthenticated requests
// requireAdmin — rejects non-admin sessions
// requireOwnerOrAdmin — allows own-department_head or admin
```

Apply `requireAuth` to all `/api` routes except `/api/auth/login`.
Apply `requireAdmin` to all user, department, and status-change routes.
Submissions `GET /api/submissions`: filter by `department_id` if `req.user.role === 'department_head'`.

---

## Session Configuration

```javascript
session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
})
```

---

## Email Notification Events

Trigger on `PATCH /api/submissions/:id/status`:

| Status set to | Recipient | Subject |
|---------------|-----------|---------|
| `published` | submitter | "Your submission has been published" |
| `needs_revision` | submitter | "Your submission needs revision" |
| `pending` | admin | "New submission received" — trigger on initial POST |

Transporter must be defined in a standalone `mailer.js` module. No inline transport config in route handlers.

---

## Frontend Routes

```
/login                          — unauthenticated only
/dashboard                      — post-login home, role-aware
/submissions                    — list view (filtered by role)
/submissions/new                — submission form
/submissions/:id                — detail + status history
/resources                      — searchable/filterable directory
/resources/new                  — add resource form
/admin/users                    — admin only
/admin/departments              — admin only
/admin/categories               — pending category approvals
```

---

## Role-Based UI Rules

| Element | admin | department_head | staff |
|---------|-------|----------------|-------|
| Status change controls | ✓ | ✗ | ✗ |
| Admin notes field | ✓ | read-only | ✗ |
| All submissions visible | ✓ | own dept only | ✗ |
| Add resource | ✓ | ✓ | ✓ |
| Suggest category | ✓ | ✓ | ✓ |
| Approve category | ✓ | ✗ | ✗ |
| User management | ✓ | ✗ | ✗ |

---

## Project Structure

```
/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── main.jsx
│   └── vite.config.js          — build.outDir: 'dist'
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── departments.js
│   │   ├── submissions.js
│   │   ├── resources.js
│   │   └── resourceCategories.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db/
│   │   ├── index.js            — pg Pool export
│   │   └── seed.js
│   ├── mailer.js               — Nodemailer transporter module
│   └── index.js                — Express entry point
├── .env
└── package.json
```

---

## Build & Deploy Notes

- `vite.config.js` must set `build.outDir` to `dist`
- Express serves `client/dist` as static in production
- All secrets via `.env` — never committed
- No Replit-specific hosting dependencies
- `package.json` start script: `node server/index.js`
- Build script: `npm run build` (Vite)
- Publish directory for Kinsta/Sevalla static fallback: `dist`
- Error document: `index.html` (SPA routing)

---

## Google OAuth Readiness (not implemented now)

- `users.google_id` column exists in schema
- Session-based auth must be implemented via Passport.js local strategy so `passport-google-oauth20` strategy can be added later without rewriting auth flow
- Do not use custom session logic that bypasses Passport

---

## Constraints

- No file upload endpoints — attachment field is `VARCHAR(500)` URL only
- No SQLite — PostgreSQL only
- No hardcoded credentials anywhere in source
- Email transporter must be in isolated module
- New resource categories require admin approval before appearing in dropdowns
- New resources submitted by any authenticated user are immediately active — no approval queue
- `status_history` must be written atomically with every status change on a submission — use a transaction
