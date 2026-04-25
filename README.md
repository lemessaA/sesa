# SESA Web App — developer setup

This repository is a monorepo with three runnable parts:

| Directory        | Role |
|-----------------|------|
| `backend/`      | Node.js + Express API (port **5000** by default) |
| `frontend/`     | Vite + React (typically port **3000** or **5173**) |
| `python-agents/`| Optional LangGraph + FastAPI agent + RAG (port **8088** by default) |

---

## Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9  
- **MongoDB** — local via Docker (recommended) or MongoDB Atlas  
- **Python** 3.11+ (only if you run `python-agents/`)  
- **Git**

---

## 1. Clone and install dependencies

```bash
git clone <repository-url> sesa-webapp
cd sesa-webapp

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

Optional — root `package.json` only has small helpers (`db:up`, etc.); you do **not** need `npm install` at the repo root for the app to run.

---

## 2. Environment files

Copy examples and edit **secrets and URLs** (never commit real `.env` files).

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Optional: Vite already uses frontend/.env.development in dev; align API URL with your backend.
```

**Backend (`backend/.env`) — minimum for local dev**

- `JWT_SECRET` / `JWT_REFRESH_SECRET` — long random strings  
- `USE_LOCAL_DB=1` — use local MongoDB when using Docker (see below)  
- `MONGO_URI` — leave empty for local default, or set explicit local/Atlas URI  
- `CORS_ORIGIN` / `FRONTEND_URL` — match your Vite dev URL (e.g. `http://localhost:3000`)

**Frontend**

- `frontend/.env.development` is used in dev and should point the browser at the API, e.g.  
  `VITE_API_URL=http://127.0.0.1:5000/api`

**LangGraph / RAG (`python-agents/`) — optional**

```bash
cd python-agents
cp .env.example .env
# Set GROQ_API_KEY; BACKEND_INTERNAL_API_BASE should match your API (e.g. http://127.0.0.1:5000/api)
```

In **`backend/.env`**, set:

```env
LANGGRAPH_AGENT_URL=http://127.0.0.1:8088
```

If this is unset, the API falls back to inline AI for agent chat (no Python service required).

---

## 3. Database (local)

From the **repository root**:

```bash
npm run db:up
```

This starts MongoDB on **27017** (see `docker-compose.yml`). In `backend/.env` use `USE_LOCAL_DB=1` and either leave `MONGO_URI` empty (the app defaults to a local URI) or set it explicitly.

Seed demo data (from `backend/`):

```bash
cd backend
npm run seed
# or: npm run seed:enhanced
```

Use the emails/passwords printed by the seed script to sign in.

---

## 4. Run the app (two terminals minimum)

**Terminal A — API**

```bash
cd backend
npm run dev
```

**Terminal B — frontend**

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (often `http://localhost:3000/`). The UI talks to `VITE_API_URL`.

---

## 5. Optional: Python agent (LangGraph + RAG)

Install dependencies (virtualenv recommended):

```bash
cd python-agents
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run-dev.sh
```

Or: `uv pip install -r requirements.txt` / `fastapi dev` if you use those tools.  
The default script serves **`http://127.0.0.1:8088`**. Match `LANGGRAPH_AGENT_URL` in `backend/.env`.

RAG indexes are stored under `python-agents/data/rag/` (see `.gitignore`).

---

## 6. Useful commands

| Command | Where | Purpose |
|--------|--------|--------|
| `npm run dev` | `backend/` | API with hot reload (`tsx watch`) |
| `npm run build` | `backend/` | TypeScript compile to `dist/` |
| `npm run dev` | `frontend/` | Vite dev server |
| `npm run build` | `frontend/` | Production build |
| `npm run db:up` / `db:down` | repo root | Start/stop local MongoDB |
| `npm run agent:dev` | repo root | Runs `python-agents/run-dev.sh` |
| `npm run seed` | `backend/` | Seed database |

---

## 7. Troubleshooting

- **CORS / login to wrong API** — ensure `VITE_API_URL` matches a running backend and `CORS_ORIGIN` includes your Vite origin.  
- **Mongo connection** — confirm `db:up` (or Atlas URI), `USE_LOCAL_DB`, and `MONGO_URI`.  
- **Agent / RAG 502** — start `python-agents`, set `LANGGRAPH_AGENT_URL`, and set `GROQ_API_KEY` in `python-agents/.env`.  
- **RAG document APIs** — require an **approved** student enrollment (enforced in the API).

---

## Further reading

- `README_DEPLOYMENT.md` — deployment notes (if present)  
- `backend/README.md` — backend-specific details  

For production environment variables, treat `backend/.env.example` and `frontend/.env.example` as the checklists to mirror on your host or platform.
