# 🚀 VariMitra (Smart Wari) — Global Deployment Guide

This guide provides step-by-step instructions for deploying the **VariMitra** platform to any cloud provider or server without dependency issues.

---

## 🏗️ Architecture Overview

The containerized stack consists of three coordinated services:

```
                  ┌──────────────────────────────────────────────┐
                  │              Internet / Clients              │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP (Port 80/443)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Frontend Container] Nginx (Alpine)                                             │
│  • Serves high-speed React 19 SPA static assets (Gzip compressed, HTTP cache)   │
│  • Reverse proxies /api/  ──────> Backend (Port 8000)                           │
│  • Reverse proxies /ws/   ──────> WebSocket Channels                            │
│  • Reverse proxies /static/ ────> Django Admin Assets                           │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Backend Container] Django 5 + Daphne ASGI (Python 3.12 Slim)                   │
│  • Real-time WebSockets & REST APIs                                             │
│  • WhiteNoise static asset engine                                               │
│  • Automated database migrations on startup                                     │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Database Container] PostgreSQL 16 (Alpine)                                     │
│  • Persistent Docker Volume (postgres_data)                                     │
│  • Pre-seeded schema and telemetry indexes                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Option 1: One-Command Deployment with Docker Compose (Any VPS / Cloud Server)

Works on any **Ubuntu / Debian / AlmaLinux** server (DigitalOcean Droplet, AWS EC2, Hetzner, Linode, Azure VM):

### 1. Install Docker & Compose on the Server
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clone Repository
```bash
git clone https://github.com/sagarpc1006/Varithon.git
cd Varithon
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
POSTGRES_PASSWORD=your_super_strong_password_here
SECRET_KEY=generate_a_long_random_secret_key_here
DEBUG=False
ALLOWED_HOSTS=*
LOAD_SEED_DATA=true
```

### 4. Build and Launch
```bash
docker compose up -d --build
```

- Your app is now live at `http://your-server-ip`!
- Database migrations and seed data load automatically during container launch.

---

## ☁️ Option 2: Deploying to Render.com

Render offers free/low-cost managed PostgreSQL, Web Services, and Static Sites.

### A. Deploy Managed PostgreSQL:
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Name: `varimitra-db`, Database: `varimitra`, User: `postgres`.
4. Copy the **Internal Database URL**.

### B. Deploy Backend (Web Service):
1. Click **New +** → **Web Service**.
2. Connect your `Varithon` GitHub repository.
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (or `Python 3`)
   - **DockerfilePath**: `Dockerfile`
4. Add Environment Variables:
   - `DATABASE_URL`: *(paste the Render internal PostgreSQL URL)*
   - `DEBUG`: `False`
   - `SECRET_KEY`: *(generate a secure random string)*
   - `ALLOWED_HOSTS`: `.onrender.com,localhost`
   - `LOAD_SEED_DATA`: `true`
5. Click **Create Web Service**.

### C. Deploy Frontend (Static Site or Docker Service):
1. Click **New +** → **Static Site**.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
   - `VITE_WS_URL`: `wss://your-backend-service.onrender.com`
   - *(add your `VITE_FIREBASE_*` variables from frontend/.env)*
6. Set Rewrite Rules:
   - Source: `/*`, Destination: `/index.html`, Action: `Rewrite`.

---

## 🚆 Option 3: Deploying to Railway.app

1. Install the Railway CLI: `npm i -g @railway/cli`
2. Run in repository root:
   ```bash
   railway login
   railway init
   railway up
   ```
3. In Railway web UI:
   - Add a **PostgreSQL** database service.
   - Connect the PostgreSQL connection string variable `${{Postgres.DATABASE_URL}}` to your backend service.

---

## 🪶 Option 4: Deploying to Fly.io

1. Install Flyctl: `curl -L https://fly.io/install.sh | sh`
2. Launch the backend:
   ```bash
   cd backend
   fly launch
   fly postgres create
   fly postgres attach
   fly deploy
   ```

---

## 📋 Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DEBUG` | `False` | Toggle Django debug mode (`False` in production) |
| `SECRET_KEY` | *(auto)* | Django cryptographical signing secret |
| `ALLOWED_HOSTS` | `*` | Comma-separated list of valid hostnames/domains |
| `DB_ENGINE` | `django.db.backends.postgresql` | Database engine (`postgresql` or `sqlite3`) |
| `POSTGRES_DB` | `varimitra` | PostgreSQL database name |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | *(set in .env)* | PostgreSQL user password |
| `POSTGRES_HOST` | `db` | Database host (`db` for Docker Compose) |
| `POSTGRES_PORT` | `5432` | Database port |
| `DATABASE_URL` | *(optional)* | Full connection URI (e.g. Supabase, Neon, Render) |
| `LOAD_SEED_DATA` | `true` | Pre-load initial sample users, groups, & points |
| `VITE_API_URL` | `/api` | Base URL for REST endpoints |
| `VITE_WS_URL` | *(auto)* | WebSocket endpoint for real-time chat & alerts |
