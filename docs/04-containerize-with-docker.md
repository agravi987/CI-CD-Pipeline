# 🐳 Milestone 4 — Containerize & Orchestrate with Docker Compose

## 🎯 Goal

Turn your working app into **immutable container images** and orchestrate them
with **Docker Compose**. One command — `docker compose up` — starts the
database, API, and the Nginx-served frontend together. This is the exact same
compose shape your CD pipeline will use to deploy to real servers.

> 🛣️ **Which path are you on?** This is **Option 2 — build the app yourself**.
> Option 1 builders: jump straight to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> The Dockerfiles / compose files in the repo are your **spec and answer key**.

---

## 📝 Step 1 — Backend: multi-stage Dockerfile

Each **stage** is a named layer; you build the one you need with `--target`.
This one image serves both a tiny production runtime *and* a big dev toolchain.

**`backend/Dockerfile`**:

```dockerfile
# Stage 1 — deps: full install (keeps the dev stage fast + cached)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 — prod-deps: production-only dependencies
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 3 — runtime: slim image, only what's needed to run  ⬅ default
FROM node:22-alpine AS runtime
USER node
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "src/index.js"]

# Stage 4 — dev: full tooling + nodemon for hot reload
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

Plus **`backend/.dockerignore`** (`node_modules/`, `*.log`, …) so `COPY . .`
never ships 50 MB of local deps into the image.

> 🧠 **Why so many stages?** `USER node` (unprivileged!) + `--omit=dev` + a
> `HEALTHCHECK` that hits `/api/health` are exactly what your CD, rollback, and
> load balancers expect. And the pipeline will *scan* this image with Trivy in
> Milestone 7 — a lean runtime = fewer vulnerabilities.

---

## 📝 Step 2 — Frontend: build-serve split + Nginx

A multi-stage build **compiles** React → static files, then **serves** them
with Nginx. The runtime image has zero Node.js — just Nginx + files.

**`frontend/Dockerfile`** (three stages):

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Default target: tiny Nginx image with just the artifacts
FROM nginx:1.27-alpine AS serve
RUN chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Dev: Vite dev server with hot reload
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**`frontend/nginx.conf`** — the server block that SPA-falls-back and **proxies
`/api` to the backend service** (the production replacement for the Vite proxy):

```
server {
    listen       8080;
    server_name  _;

    root   /usr/share/nginx/html;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;     # SPA routing
    }

    location /api/ {
        proxy_pass http://backend:3000;       # service name from compose!
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

> 🧠 Note `proxy_pass http://backend:3000` — **`backend` is the compose service
> name**, not `localhost`. Inside the network Docker creates for your compose
> project, containers reach each other by service name. This becomes your mental
> model for the whole deployment story.

---

## 📝 Step 3 — Docker Compose: one command, three services

**`docker-compose.yml`** (the main file):

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      target: runtime
    environment:
      DB_HOST: db              # ← service name, NOT localhost
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      target: serve
    depends_on:
      - backend
    ports:
      - "8080:8080"
    restart: unless-stopped

volumes:
  db-data:
```

**`.env.example`** — every `${VAR}` compose interpolates:

```text
# PostgreSQL
POSTGRES_USER=appuser
POSTGRES_PASSWORD=change_me_please
POSTGRES_DB=appdb

# Backend
DB_HOST=db
DB_PORT=5432
DB_NAME=appdb
DB_USER=appuser
DB_PASSWORD=change_me_please
```

**`docker-compose.dev.yml`** — *overlay* file merged on top for dev: it switches
both apps to the `dev` build targets (hot reload) and opens Postgres on the
host. Use it with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`.

> 🧠 `depends_on: condition: service_healthy` means backend **waits for
> Postgres to actually accept connections** before it starts — no race, no
> retry loops.

---

## 📝 Step 4 — Run the whole stack

```powershell
cd ci-cd-pipeline-app
Copy-Item .env.example .env          # sed the password if you like; it's local
docker compose up -d --build

# wait ~20s for images + health checks, then:
curl http://localhost:8080/api/health      # {"status":"ok",...} through Nginx!
docker compose ps                          # all 3 containers running
docker compose logs backend                # "✅ Database ready"
```

Open **http://localhost:8080** — the Nginx-served app in all its glory. Post a
message: browser → Nginx → backend → Postgres → back. 🎉

> 📸 **Proof of work:** saved in **`docs/screenshots/04-docker-up.png`** — terminal showing `docker compose ps` with **db / backend / frontend** all `Up (healthy)`, plus the app loaded on `localhost:8080`.
> ![Proof of work — full stack up](screenshots/04-docker-up.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module` in container | `.dockerignore` excluded too much | Only ignore `node_modules/`, `dist/`, `.env`, `*.log` |
| Backend exits, `db` restarting | Postgres healthcheck not green yet | `docker compose logs db`; wait, `depends_on` handles the rest |
| `failed to solve: pull access denied` | Typo in image name/version | Use `postgres:16-alpine`, `nginx:1.27-alpine`, `node:22-alpine` |
| Port 8080 busy | Another service | Map `"8081:8080"` in `ports` |

---

## ✅ Checkpoint

```
[ ] ✔️ backend/Dockerfile has deps → prod-deps → runtime → dev stages
[ ] ✔️ frontend/Dockerfile builds + serves with Nginx (no Node at runtime)
[ ] ✔️ nginx.conf proxies /api → http://backend:3000
[ ] ✔️ docker compose up -d --build starts all 3 services healthy
[ ] ✔️ http://localhost:8080/api/health returns ok THROUGH Nginx
[ ] ✔️ Screenshot saved as docs/screenshots/04-docker-up.png
[ ] ✔️ You can explain: compose service names are DNS names inside the network
```

---

➡️ **Next:** [Milestone 5 — Make the App Testable](05-make-the-app-testable.md)