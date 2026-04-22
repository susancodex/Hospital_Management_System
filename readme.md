# Hospital Management System

Full-stack hospital management application with a React + Vite frontend and a Django REST backend.

## Stack

- Frontend: React 19, Vite 8, Tailwind CSS 4, React Router, Zustand, Axios, React Hook Form + Zod
- Backend: Django 5, Django REST Framework, SimpleJWT, django-filter, django-cors-headers
- Database: SQLite (`db.sqlite3`)

## Project Structure

```
├── backend/                 # Django backend
│   ├── core/            # Django app (models, serializers, views, urls)
│   ├── hospital_system/ # Django project settings and root urls
│   ├── manage.py      # Django management script
│   └── db.sqlite3   # Database
├── frontend/            # React frontend
│   ├── src/          # React source code
│   └── package.json  # Frontend dependencies
├── dist/              # Built frontend assets
└── readme.md
```

## Prerequisites

- Node.js 20+
- Python 3.12+

## Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
pip install django django-cors-headers django-filter djangorestframework djangorestframework-simplejwt Pillow
```

## Run the Project

Open two terminals in the project root.

### 1) Start Django backend

```bash
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Backend URL:

- http://localhost:8000
- API base used by frontend: http://localhost:8000/api

### 2) Start React frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Frontend URL:

- Usually http://localhost:5000
- If 5000 is busy, Vite automatically picks the next available port

## Build Frontend

```bash
cd frontend
npm run build
```

Build output is generated in `dist/`.

## Authentication Notes

- JWT tokens are stored in localStorage:
  - `access_token`
  - `refresh_token`
- Frontend auth service supports `/auth/...` routes

## API Endpoints

Base API URL: `http://localhost:8000/api`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/token/` | Login and receive access/refresh tokens | No |
| POST | `/token/refresh/` | Refresh access token | No |
| POST | `/register/` | Register a new user | No |
| POST | `/forgot-password/` | Reset password using username + email | No |
| POST | `/change-password/` | Change current user password | Yes |
| GET/PATCH | `/profile/` | Get or update profile (supports image upload) | Yes |
| GET | `/users/me/` | Get current authenticated user | Yes |
| GET/POST | `/patients/` | List or create patients | Yes |
| GET/PATCH/PUT/DELETE | `/patients/{id}/` | Retrieve, update, or delete patient | Yes |
| GET/POST | `/doctors/` | List or create doctors | Yes |
| GET/PATCH/PUT/DELETE | `/doctors/{id}/` | Retrieve, update, or delete doctor | Yes |
| GET/POST | `/appointments/` | List or create appointments | Yes |
| GET/PATCH/PUT/DELETE | `/appointments/{id}/` | Retrieve, update, or delete appointment | Yes |
| GET/POST | `/medical-records/` | List or create medical records | Yes |
| GET/PATCH/PUT/DELETE | `/medical-records/{id}/` | Retrieve, update, or delete record | Yes |
| GET/POST | `/billing/` | List or create billing entries | Yes |
| GET/PATCH/PUT/DELETE | `/billing/{id}/` | Retrieve, update, or delete billing entry | Yes |

## Common Issues

### `ModuleNotFoundError: No module named 'django'`
Install backend dependencies in the active Python environment.

### `Cannot use ImageField because Pillow is not installed`
Install Pillow:

```bash
pip install Pillow
```