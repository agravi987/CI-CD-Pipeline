# =============================================================================
# backend/Dockerfile — how to build the API's container image
# =============================================================================
# 🎯 WHAT THIS FILE DOES (plain English):
#   A Dockerfile is a recipe for baking an image. This one has FOUR stages
#   (mini recipes) so we can build DIFFERENT flavors depending on need:
#     deps       → install all dependencies (shared by the dev stage)
#     prod-deps  → install ONLY production dependencies (smaller image)
#     runtime    → the slim production image  ← DEFAULT (what CI/CD uses)
#     dev        → the big dev image with hot reload
#
#   Building one stage:  docker build --target runtime .
#
# LINE-BY-LINE: read the `#` comments beside every block below.
# =============================================================================

# ============================================================
# Stage 1 — deps: full install (keeps the dev stage fast + cached)
# ============================================================
FROM node:22-alpine AS deps        # start from Node 22 (tiny Linux) & name this stage "deps"
WORKDIR /app                       # make /app the working folder inside the image
COPY package.json package-lock.json ./   # copy ONLY the dependency lists first
RUN npm ci                         # install every package listed in the lockfile

# ============================================================
# Stage 2 — prod-deps: production-only dependencies
# ============================================================
FROM node:22-alpine AS prod-deps   # fresh start, name it "prod-deps"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force   # skip dev tools; clear npm cache

# ============================================================
# Stage 3 — runtime: slim image, only what's needed to run  ⬅ DEFAULT target
# ============================================================
FROM node:22-alpine AS runtime
USER node                          # run as the unprivileged "node" user (safer than root)
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules   # copy install from stage 2
COPY --chown=node:node . .         # copy the rest of the backend source code
EXPOSE 3000                        # tell Docker this image opens port 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1   # is the API alive?
CMD ["node", "src/index.js"]       # ⭐ the actual startup command

# ============================================================
# Stage 4 — dev: full tooling + nodemon for hot reload
# ============================================================
FROM node:22-alpine AS dev         # name it "dev"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                         # install EVERYTHING including dev tools
COPY --chown=node:node . .         # copy all source
RUN chown -R node:node /app        # make sure the node user can write
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]          # start with nodemon (watch + restart)