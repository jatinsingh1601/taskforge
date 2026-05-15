# TaskForge — Forge Productivity Together

A modern full-stack team task manager with role-based access control, drag-and-drop Kanban boards, and live dashboards. Built for teams that ship.

**Live Demo:** _Add your Vercel URL after deployment_
**GitHub:** _Add your repo URL_

---

## Features

- **JWT Authentication** — Signup, login, role-based access (Admin / Member)
- **Project Management** — Create projects, invite members by email
- **Kanban Board** — Drag-and-drop tasks across To Do / In Progress / Review / Done
- **Task Management** — Priority levels, due dates, assignees, descriptions
- **Live Dashboard** — KPI cards, status distribution, project progress, overdue alerts, activity feed
- **Overdue Detection** — Tasks past their due date are flagged automatically
- **Activity Logs** — Every change is recorded with user + timestamp
- **Dark / Light Mode** — Persistent theme toggle
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Toast Notifications** — Instant feedback on every action

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Icons | lucide-react (clean, professional iconography) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| State | Zustand + TanStack Query v5 |
| Drag & Drop | @dnd-kit |
| Routing | React Router DOM v6 |
| Notifications | react-hot-toast |
| Deployment | Railway (backend + DB) + Vercel (frontend) |

---

## Project Structure

```
task-manager/                # Rename to "taskforge" if you like
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/              # PostgreSQL schema + connection pool
│   │   ├── middleware/      # JWT auth, admin check, error handler
│   │   ├── controllers/     # Auth, Project, Task, Dashboard logic
│   │   └── routes/          # REST endpoints
│   ├── scripts/initDb.js
│   └── index.js
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios with JWT interceptor
│   │   ├── components/      # Layout, Logo, EmptyState
│   │   ├── pages/           # Login, Register, Dashboard, Projects, ProjectDetail, Profile
│   │   ├── store/           # Zustand auth store
│   │   └── App.jsx
│   ├── public/favicon.svg
│   └── vite.config.js
├── README.md
└── DEPLOYMENT.md            # Step-by-step deployment guide
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or a Railway/Supabase/Neon hosted DB)

### Backend
```bash
cd server
cp .env.example .env       # fill in your DB credentials
npm install
node scripts/initDb.js     # creates tables
npm run dev                # starts on http://localhost:5000
```

Your `server/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskforge
JWT_SECRET=your_secret_minimum_32_characters_long_random_string
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173 and you're in.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + members |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/project/:projectId` | List project tasks |
| POST | `/api/tasks/project/:projectId` | Create task |
| GET | `/api/tasks/:id` | Get task + activity |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Change status |
| PATCH | `/api/tasks/:id/assign` | Reassign |
| DELETE | `/api/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Aggregate stats |
| GET | `/api/dashboard/my-tasks` | My assigned tasks |

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Railway + Vercel walkthrough.

---

## License

MIT
