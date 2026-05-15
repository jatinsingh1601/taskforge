# TaskForge — Deployment Guide

Step-by-step instructions to take TaskForge from local code to a live, public URL using **Railway** (database + backend API) and **Vercel** (frontend).

Total time: ~25 minutes.

---

## Pre-flight Checklist

- [ ] App runs locally (`npm run dev` in both `server/` and `client/`)
- [ ] You can sign up, log in, create a project, and add a task locally
- [ ] You have a **GitHub** account
- [ ] You have a **Railway** account ([railway.app](https://railway.app))
- [ ] You have a **Vercel** account ([vercel.com](https://vercel.com))

---

## STEP 1 — Push to GitHub

```bash
cd task-manager      # or wherever your project folder is
git init
git add .
git commit -m "feat: TaskForge initial commit"
git branch -M main
```

Create a new public repo at https://github.com/new (name it `taskforge`), then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/taskforge.git
git push -u origin main
```

---

## STEP 2 — Set up PostgreSQL on Railway

1. Go to https://railway.app/new → **Empty Project** → name it `taskforge`
2. Inside the project: **+ New** → **Database** → **Add PostgreSQL**. Wait ~30 sec.
3. Click the **Postgres** service → **Variables** tab → reveal and copy `DATABASE_URL`.
4. In the same service → **Data** tab → **Query** button.
5. Open `server/src/db/schema.sql` locally, copy its entire contents, paste into the query box → **Run Query**.

Tables created. ✅

---

## STEP 3 — Deploy the Backend on Railway

1. Same Railway project → **+ New** → **GitHub Repo** → select your `taskforge` repo.
2. Click the new service → **Settings** → **Root Directory** → set to `server`.
3. Go to **Variables** tab and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click **Add Reference** → `Postgres.DATABASE_URL` |
| `JWT_SECRET` | A random 32+ char string (e.g. `taskforge_jwt_2026_xK9mPqR4tZ7nL3vY8wH`) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `CLIENT_URL` | `*` (temporary — we update this after Vercel deploy) |

4. Railway auto-deploys. Wait ~2 min.
5. **Settings** → **Networking** → **Generate Domain**.
6. Test: open `https://<your-url>/health` → should return `{"status":"ok","service":"taskforge-api"}`.

Copy the backend URL. ✅

---

## STEP 4 — Deploy the Frontend on Vercel

1. Go to https://vercel.com/new → import your `taskforge` repo.
2. Configure:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** Edit → `client`
   - Leave Build/Output as defaults
3. Add **Environment Variable**:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<your-railway-backend>/api` |

⚠️ Include `/api` at the end. Example: `https://taskforge-production-abcd.up.railway.app/api`

4. Click **Deploy**. Wait ~2 min.
5. Vercel gives you a URL like `https://taskforge-xyz.vercel.app`.

---

## STEP 5 — Connect Backend ↔ Frontend (CORS)

1. Railway → backend service → **Variables** → edit `CLIENT_URL` → set to your Vercel URL (no trailing slash).
2. Save. Backend auto-redeploys (~30 sec).

---

## STEP 6 — Final Test

Open your Vercel URL in a fresh tab.
- Register as Admin
- Create a project, add a task
- Drag the task across the Kanban board
- Toggle dark mode

If everything works — you're live. 🎉

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Failed to fetch" / CORS error | `CLIENT_URL` on Railway must EXACTLY match Vercel URL (no trailing `/`) |
| `VITE_API_URL` issue | Must include `https://` and end with `/api` |
| "Invalid token" loop | Clear localStorage in DevTools |
| `npm install` fails | Run `npm install --legacy-peer-deps` |
| Schema not applied | Re-paste `schema.sql` into Railway Postgres → Data → Query |
| Backend won't start | Check all 5 env vars are set in Railway Variables tab |

---

## Submission Checklist

- [ ] **Live URL:** `https://taskforge-xyz.vercel.app`
- [ ] **GitHub Repo:** `https://github.com/YOUR_USERNAME/taskforge`
- [ ] **README:** included in your repo
- [ ] **Demo Video (2–5 min):** record yourself using the app — register, create project, add member, create task, drag Kanban, show dashboard, toggle dark mode, briefly tour the code. Upload to YouTube (unlisted) or Loom.

Good luck with the submission.
