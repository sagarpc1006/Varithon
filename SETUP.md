# 🛠️ WariMitra — Setup Guide

Follow these steps after cloning the repo to get both backend and frontend running locally.

---

## Prerequisites

Make sure you have these installed before starting:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

Check versions:
```powershell
python --version
node --version
npm --version
git --version
```

---

## 1. Clone the repo

```powershell
git clone https://github.com/sagarpc1006/Varithon.git
cd Varithon
```

---

## 2. Backend Setup (Django)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
```

> If activation fails with a "running scripts is disabled" error, run this once:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

Install dependencies:
```powershell
pip install -r requirements.txt
```

### Firebase server authentication

Set the variables in `backend/.env.example` in your shell or deployment. Download
a Firebase service-account JSON from **Firebase Console → Project settings →
Service accounts**, keep it outside this repository, and set
`GOOGLE_APPLICATION_CREDENTIALS` to its absolute path.
Use `FIREBASE_PROJECT_ID=ruralmed-6cf34-16241`.

Run migrations:
```powershell
python manage.py migrate
```

Start the backend server:
```powershell
python manage.py runserver
```

Visit **http://127.0.0.1:8000** — you should see Django running.

### Every time you come back to work on backend:
```powershell
cd backend
venv\Scripts\activate
python manage.py runserver
```
(Stop with `Ctrl + C`)

---

## 3. Frontend Setup (React + Vite + Tailwind)

Open a **new terminal**, then:

```powershell
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`. In Firebase Authentication,
enable **Google** and **Email/Password** providers and add deployed frontend
domains to **Authorized domains**.

Start the frontend dev server:
```powershell
npm run dev
```

Visit the local URL shown in the terminal (usually **http://localhost:5173**).

### Every time you come back to work on frontend:
```powershell
cd frontend
npm run dev
```
(Stop with `Ctrl + C`)

---

## 4. Project Structure Reference

```
Varithon/
├── backend/       # Django REST Framework API
│   ├── accounts/
│   ├── sos/
│   ├── maps/
│   ├── resources/
│   ├── crowdflow/
│   ├── services_nearby/
│   └── alerts/
├── frontend/      # React PWA
│   └── src/
│       ├── auth/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── hooks/
└── docs/
    └── ARCHITECTURE.md   # full system design reference
```

---

## 5. Git Workflow — Branch Before You Code

**Never commit directly to `main`.** Create a feature branch first:

```powershell
git checkout -b feature/<your-feature-name>
```

Example:
```powershell
git checkout -b feature/A-sos-button
```

When your work is ready:
```powershell
git add .
git commit -m "Short description of what you did"
git push origin feature/<your-feature-name>
```

Then open a Pull Request into `main` on GitHub — don't merge your own PR without at least one teammate reviewing it if possible.

---

## 6. Common Issues

| Problem | Fix |
|---|---|
| `venv\Scripts\activate` fails | Run the `Set-ExecutionPolicy` command above once |
| `pip install -r requirements.txt` fails | Make sure venv is activated (prompt shows `(venv)`) |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |
| Port 8000 or 5173 already in use | Close other running servers, or restart terminal |
| Folder shows empty after pull | Just `git pull` again — some folders only populate once code is added |

---

## Questions?

Ping the team group chat — don't get stuck for more than 15 minutes on a setup issue.
