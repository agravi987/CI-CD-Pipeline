# 🐳 Milestone 4 — Containerize & Orchestrate with Docker Compose

## 🎯 Goal (plain English)

Turn the working app into **container images** and start all three pieces
(database, backend, frontend) with **one command**: `docker compose up`.

This is also the exact same shape your CD pipeline will use on real servers —
except servers *pull* ready-made images instead of building them.

> 🛣️ **Which path?** This is **Option 2 — build the app yourself**. On
> Option 1? Skip to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> The Dockerfiles / compose files in the repo are your **spec and answer key**.

---

## 🤔 A Dockerfile is a recipe

A **Dockerfile** bakes an image. Multi-stage = several named recipes in one
file; you build only the stage you want with `--target`. Why bother?

- The **runtime** stage is slim (fewer packages → fewer vulnerabilities).
- The **dev** stage is big (has all the tooling for hot reload).
- CI builds the runtime image in Milestone 7, so a lean target matters.

---

## 📝 Step 1 — Backend: multi-stage Dockerfile

**`backend/Dockerfile`** (fully commented in the repo). The four stages:

| Stage | What it does | Used by |
|-------|--------------|---------|
| `deps` | Installs ALL dependencies | builds the `dev` stage fast |
| `prod-deps` | Installs ONLY production deps | builds `runtime` fast |
| `runtime` ⬅ default | Slim image that just RUNS the API | **production / CI / CD** |
| `dev` | Full tooling + nodemon hot reload | local development |

Key lines:

```dockerfile
FROM node:22-alpine AS runtime      # production target
USER node                           # run as non-root (safer)
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
HEALTHCHECK --interval=30s ... CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "src/index.js"]        # the startup command
```

Why this matters for the pipeline: `USER node` (unprivileged), `--omit=dev`
(small), and a **`HEALTHCHECK` that touches `/api/health`** are exactly what CD,
rollback, and load balancers rely on. Trivy also *scans* this image in
Milestone 7 — a lean runtime = fewer findings.

Also add **`backend/.dockerignore`** (`node_modules/`, `*.log`, …) so `COPY . .`
never drags 50 MB of local deps into the image.

---

## 📝 Step 2 — Frontend: build-serve split + Nginx

React is compiled into plain HTML/CSS/JS, then served by **Nginx**. The runtime
image has **zero Node.js** — just Nginx + files.

**`frontend/Dockerfile`** (fully commented). Stages:

| Stage | What it does | Used by |
|-------|--------------|---------|
| `build` | `npm ci` + `npm run build` → `dist/` | the first half of production |
| `serve` ⬅ default | Nginx serving `dist/` on port 8080 | **production / CI / CD** |
| `dev` | Vite dev server with hot reload (port 5173) | local development |

**`frontend/nginx.conf`** — the server config. Two jobs:

1. Serve the built site, with SPA fallback (`try_files ... /index.html`).
2. **Proxy `/api/*` to the backend** — the production replacement for the Vite
   dev proxy from Milestone 2:

```nginx
location /api/ {
    proxy_pass http://backend:3000;    # 'backend' = the compose SERVICE NAME
}
```

> 🧠 **Learn this mental model now:** inside Docker's network, containers reach
> each other by **service name**, not `localhost`. `backend` is a name Docker
> makes up from the compose file — it becomes a DNS address.

---

## 📝 Step 3 — Docker Compose: one command, three services

**`docker-compose.yml`** — the main recipe (fully commented in the repo). The
shape:

```yaml
services:
  db:                                  # postgres, healthcheck, named volume
  backend:                             # build ../backend target=runtime, talks to "db"
  frontend:                            # build ../frontend target=serve, port 8080
volumes:
  db-data:                             # Postgres data survives restarts
```

| Key concept | Plain words |
|-------------|-------------|
| `services:` | Each container = one service in the network |
| `${VAR}` | Placeholder Docker fills from your `.env` file |
| `depends_on: condition: service_healthy` | "Don't start the backend until Postgres actually accepts connections" — kills timing races |
| Service name as DNS | `backend` in Nginx resolves to the backend container's address |
| `volumes:` (named) | A hard drive for Postgres so data survives `up/down` |

**`.env.example`** (repo root) → copy to `.env` and fill in values:

```powershell
Copy-Item .env.example .env
```

**`docker-compose.dev.yml`** — an *overlay* merged on top for dev: switches both
apps to the `dev` build targets (hot reload) and opens Postgres to your laptop.
Run with:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 📝 Step 4 — Run the whole stack

```powershell
cd ci-cd-pipeline-app
Copy-Item .env.example .env        # once; edit the password if you like
docker compose up -d --build

# wait ~20s for images + health checks, then:
curl http://localhost:8080/api/health      # {"status":"ok",...} — through Nginx!
docker compose ps                          # all 3 containers running
docker compose logs backend                # "✅ Database ready"
```

Open **http://localhost:8080** — the Nginx-served app. Post a message and watch
it travel: browser → Nginx → backend → Postgres → back.

> 📸 **Proof of work:** save **`docs/screenshots/04-docker-up.png`** — terminal
> showing `docker compose ps` with **db / backend / frontend** all
> `Up (healthy)`, plus the app loaded on `localhost:8080`.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module` in container | `.dockerignore` excluded too much | Only exclude `node_modules/`, `dist/`, `.env`, `*.log` |
| Backend exits, `db` restarting | Postgres healthcheck not green yet | `docker compose logs db`; `depends_on` handles the rest |
| `failed to solve: pull access denied` | Typo in an image name/version | Use `postgres:16-alpine`, `nginx:1.27-alpine`, `node:22-alpine` |
| Port 8080 busy | Another service on that port | Map `"8081:8080"` in `ports` |

---

## ✅ Checkpoint

```
[ ] ✔️ backend/Dockerfile has deps → prod-deps → runtime → dev stages
[ ] ✔️ frontend/Dockerfile builds + serves with Nginx (no Node at runtime)
[ ] ✔️ nginx.conf proxies /api → http://backend:3000
[ ] ✔️ docker compose up -d --build starts all 3 services healthy
[ ] ✔️ http://localhost:8080/api/health returns ok THROUGH Nginx
[ ] ✔️ Screenshot saved as docs/screenshots/04-docker-up.png
[ ] ✔️ You can explain: service names are DNS names inside the compose network
```

---

➡️ **Next:** [Milestone 5 — Make the App Testable](05-make-the-app-testable.md)