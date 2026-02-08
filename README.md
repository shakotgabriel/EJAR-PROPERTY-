<<<<<<< HEAD
# Ejar
Ejar is a modern, full‑stack property rental platform that connects property owners and tenants efficiently and securely. It provides a seamless experience for listing, discovering, and renting properties online, with integrated real-time communication and notifications.
- Frontend: React 18, Vite, TypeScript, Tailwind, React Router, React Query, Zustand, Axios
- Backend: Django, Django REST Framework, SimpleJWT, django-filter, CORS headers
- DB (dev): SQLite

Features
=======
# Ejar (Rent)

A full‑stack rental marketplace app built with a Django REST API and a React (Vite + TypeScript) frontend.

**GitHub repo description (About):** Full‑stack rental marketplace — Django REST API + React/Vite frontend (listings, messaging, notifications, auth, images).

## Features
>>>>>>> master

- Property listings with images, amenities, reviews, and inquiries
- Authentication with JWT (access + refresh)
- User flows: register/login/logout, change password, password reset
- SMS-based verification (console or Twilio backend)
- Messaging: conversations + messages
- Notifications + notification preferences
<<<<<<< HEAD
=======

## Tech stack

- Frontend: React 18, Vite, TypeScript, Tailwind, React Router, React Query, Zustand, Axios
- Backend: Django, Django REST Framework, SimpleJWT, django-filter, CORS headers
- DB (dev): SQLite

## Repo structure

- `Ejar/` — frontend (Vite app)
- `rent_backend/` — backend (Django project)

## Local development

### 1) Backend (Django)

```zsh
cd rent_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # optional but recommended
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000/`.

### 2) Frontend (React)

```zsh
cd Ejar
npm install
cp .env.example .env  # optional
npm run dev
```

Frontend runs at `http://localhost:5173/`.

## Environment variables

### Backend (`rent_backend/.env`)

See `rent_backend/.env.example`.

Common settings:

- `DJANGO_SECRET_KEY` — required for production
- `DJANGO_DEBUG` — `1` or `0`
- `DJANGO_ALLOWED_HOSTS` — comma-separated (e.g. `localhost,127.0.0.1`)
- `FRONTEND_URL` — used in password reset links
- `CORS_ALLOWED_ORIGINS` — comma-separated (e.g. `http://localhost:5173`)

SMS (optional):

- `SMS_BACKEND` — `console` (default) or `twilio`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

### Frontend (`Ejar/.env`)

See `Ejar/.env.example`.

- `VITE_API_BASE_URL` — defaults to `http://127.0.0.1:8000/api/`
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — required only if you use Supabase features

## API overview

Base path: `/api/`

- `/api/users/` — auth + users
- `/api/properties/` — properties, images, amenities, reviews, inquiries
- `/api/messages/` — conversations + messages
- `/api/notifications/` — notifications + preferences

## Notes

- File uploads are stored under `rent_backend/media/` and are served only when `DJANGO_DEBUG=1`.
- This repository is a starter/full-stack demo. Before production use, review security settings, rotate secrets, and configure proper storage/hosting.
>>>>>>> master
