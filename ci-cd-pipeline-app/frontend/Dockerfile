# =============================================================================
# frontend/Dockerfile — how to build the React app's container image
# =============================================================================
# 🎯 WHAT THIS FILE DOES (plain English):
#   Same multi-stage idea as the backend Dockerfile, but for a static web app:
#     build → compile the React code into plain HTML/CSS/JS (needs Node)
#     serve → serve those files with Nginx           ← DEFAULT (what CI/CD uses)
#     dev   → run the Vite dev server with hot reload
#
#   Why TWO stages for production? The final image only contains Nginx + the
#   built files — no Node.js, no source code, no npm. Tiny + fast + secure.
#
# LINE-BY-LINE: read the `#` comments beside every block below.
# =============================================================================

# ============================================================
# Stage 1 — build: compile React to static files
# ============================================================
FROM node:22-alpine AS build       # fresh Node 22 image, name it "build"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                         # install dependencies
COPY . .                           # copy the whole frontend source
RUN npm run build                  # Vite compiles everything → dist/ folder

# ============================================================
# Stage 2 — serve: tiny Nginx image with just the artifacts  ⬅ DEFAULT target
# ============================================================
FROM nginx:1.27-alpine AS serve    # start from the official Nginx image

# Make the runtime folders writable by the unprivileged "nginx" user so it can
# write its pid file, caches, and config. (Better than running as root.)
RUN chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx                         # running as the "nginx" user, not root

COPY nginx.conf /etc/nginx/conf.d/default.conf              # our server config (proxy /api)
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html  # the built site

EXPOSE 8080                        # the site will live on port 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1  # is Nginx answering?
CMD ["nginx", "-g", "daemon off;"] # run Nginx in the foreground (what containers expect)

# ============================================================
# Stage 3 — dev: Vite dev server with hot reload
# ============================================================
FROM node:22-alpine AS dev         # name it "dev"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
RUN chown -R node:node /app
USER node
EXPOSE 5173                        # Vite's default dev port
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]   # start Vite on all interfaces