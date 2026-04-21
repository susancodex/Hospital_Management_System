# Hospital Management System

A full-stack Hospital Management System built with React (frontend) and Django (backend).

## Architecture

- **Frontend**: React 19 + Vite, Tailwind CSS 4, Radix UI / shadcn components, React Router DOM 7, Zustand for state management, React Hook Form + Zod for forms
- **Backend**: Django 6 + Django REST Framework, JWT authentication (djangorestframework-simplejwt), django-filter, django-cors-headers
- **Database**: SQLite3 (file: `db.sqlite3`)
- **Package Manager**: pnpm (frontend), uv/pip (Python)

## Project Structure

- `src/` — React frontend source
  - `api/` — Axios API client and service abstractions
  - `pages/` — Page components (Dashboard, Appointments, Billing, etc.)
  - `context/` — Auth and Toast context providers
  - `components/` — Reusable UI components
  - `styles/` — CSS modules
- `core/` — Django app with models, views, serializers, URLs
- `hospital_system/` — Django project config (settings, URLs, WSGI)
- `components/ui/` — shadcn/ui components (Radix UI based)
- `public/` — Static assets

## Key Models

- `User` (extends AbstractUser) — role-based users
- `Doctor` — linked to User, has specialization and phone
- `Patient` — name, age, gender, phone
- `Appointment` — patient + doctor + date + reason
- `MedicalRecord` — patient diagnosis and treatment history
- `Billing` — appointment billing with status

## Workflows

- **Start application** — `pnpm run dev` on port 5000 (webview)
- **Backend API** — `python manage.py runserver localhost:8000` (console)

## Features

- **Public Landing page** at `/` (professional hero, features, stats, CTA)
- **JWT Auth**: Login, Register, Forgot Password (simplified — username + email match resets password without SMTP)
- **Profile page** at `/profile`: edit name/email/phone, upload profile picture (multipart/form-data → `/media/`), change password
- **Search**: debounced search bars on Patients, Doctors, Appointments, Medical Records, and Billing pages (uses DRF `search_fields`); global navbar search redirects to `/patients?q=...`
- **Role-based menus** (admin, doctor, reception)

## API

- Frontend connects to backend at `http://localhost:8000/api`
- JWT tokens stored in localStorage (`access_token`, `refresh_token`)
- CORS enabled for all origins (development)

## UI Design System

The UI was redesigned to match an enterprise healthcare SaaS platform:
- **Color palette**: Primary blue (#2563EB), Success green (#22C55E), Background light gray (#F8FAFC)
- **Sidebar**: Dark navy (`#0f172a`) sidebar with Lucide icons, collapsible, active-state highlight
- **Navbar**: Search bar, notification bell, user dropdown with role-based greeting
- **Dashboard**: KPI cards, recharts area/bar/pie charts, today's appointments panel
- **Login**: Two-panel layout with branded hero section on the left
- **Components**: Redesigned buttons, modals, badges, tables, form inputs
- **Icons**: Lucide React throughout (Activity, Users, CalendarDays, CreditCard, etc.)

## Setup Notes

- Django `ALLOWED_HOSTS = ['*']` for Replit proxy compatibility
- Vite configured with `host: '0.0.0.0'` and `allowedHosts: true` for iframe preview
- Backend runs on port 8000, frontend on port 5000
