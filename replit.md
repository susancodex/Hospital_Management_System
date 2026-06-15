# Hospital Management System

A full-stack hospital management platform with role-based access control for admins, doctors, and patients — featuring appointments, medical records, billing, and AI triage.

## Run & Operate

- Workflows auto-start both services (frontend + API server)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + React Router v7 + Tailwind CSS v4 + Zustand
- API: Express 5 + JWT auth (bcrypt + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Build: esbuild (API), Vite (frontend)

## Where things live

- `artifacts/hospital-management/src/` — React frontend (pages, components, hooks, store)
- `artifacts/hospital-management/src/api/` — Axios API client (`client.js`) + services (`services.js`)
- `artifacts/hospital-management/src/styles/` — CSS files (tailwind v4, dark mode, layouts)
- `artifacts/api-server/src/routes/` — Express route files (auth, doctors, patients, appointments, medical, billing, ai)
- `artifacts/api-server/src/lib/auth.ts` — JWT generation, verification, requireAuth middleware
- `lib/db/src/schema/hospital.ts` — Drizzle schema (all tables)

## Architecture decisions

- Frontend uses Zustand for auth state (localStorage-backed JWT tokens, hydration on mount)
- API client calls `/api/*` — the Replit shared proxy routes `/api` to the Express server
- JWT secret defaults to a dev fallback; set `JWT_SECRET` env var for production
- All frontend packages in `devDependencies` (static Vite build bundles everything)
- React deduplication via `vite.config.ts` dedupe: `["react", "react-dom", "zustand"]`

## Product

- **Landing page** — public marketing page with "Sign in" / "Get started"
- **Auth** — register (admin/doctor/patient roles), login, forgot password
- **Dashboard** — role-aware stats and overview
- **Patients** — CRUD for patient records, search
- **Doctors** — CRUD for doctor profiles with specialization/department
- **Appointments** — book, manage status (pending/confirmed/completed/cancelled)
- **Medical Records** — diagnoses, treatments, prescriptions
- **Medical Reports** — file uploads and summaries
- **Billing** — invoices and payment tracking
- **AI Triage** — AI health assistant page

## Demo credentials

All demo accounts use password: `admin123`

| Username | Role | Email |
|---|---|---|
| admin | admin | admin@hospital.com |
| dr.smith | doctor | smith@hospital.com |
| dr.johnson | doctor | johnson@hospital.com |
| patient1 | patient | patient1@example.com |
| patient2 | patient | patient2@example.com |

## Gotchas

- Frontend API base URL: `/api` (no need to configure; proxy handles it)
- The `zustand` duplicate React issue is fixed via `dedupe` in `vite.config.ts`
- `pnpm dev` at workspace root will fail — run workflows instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
