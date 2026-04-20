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

## API

- Frontend connects to backend at `http://localhost:8000/api`
- JWT tokens stored in localStorage (`access_token`, `refresh_token`)
- CORS enabled for all origins (development)

## Setup Notes

- Django `ALLOWED_HOSTS = ['*']` for Replit proxy compatibility
- Vite configured with `host: '0.0.0.0'` and `allowedHosts: true` for iframe preview
- Backend runs on port 8000, frontend on port 5000
