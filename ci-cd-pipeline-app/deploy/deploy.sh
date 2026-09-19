#!/usr/bin/env bash
# =============================================================================
# deploy.sh — the deploy recipe that runs ON your server
# =============================================================================
# 🎯 WHAT THIS FILE DOES (plain English):
#   A human-friendly, typed-by-hand version of the exact same commands the
#   GitHub pipeline runs. Handy when you want to deploy manually without the
#   Actions UI.
#
#   It does 4 things:
#     1. Read which image tags to deploy (passed as arguments)
#     2. Load the .env file (DB passwords, GHCR owner)
#     3. Tell Docker to pull those exact images and restart the app
#     4. Health-check the site — only then call it a success
#
# Usage:
#   ./deploy.sh <BACKEND_IMAGE_TAG> <FRONTEND_IMAGE_TAG> [COMPOSE_DIR]
# Example:
#   ./deploy.sh sha-abc1234 sha-abc1234 /opt/cicd-production
# =============================================================================
set -euo pipefail   # ⭐ safety: exit on any error (-e), undefined var (-u), failed pipe (-o)

# The 3 inputs: 1st = backend tag, 2nd = frontend tag, 3rd = folder (optional).
# The `:?...` part means: "If missing, print this message and stop."
BACKEND_IMAGE_TAG="${1:?Usage: deploy.sh <backend-tag> <frontend-tag> [compose-dir]}"
FRONTEND_IMAGE_TAG="${2:?Usage: deploy.sh <backend-tag> <frontend-tag> [compose-dir]}"
COMPOSE_DIR="${3:-/opt/cicd-production}"   # default folder if the 3rd arg isn't given

cd "$COMPOSE_DIR"                          # move into the app folder on the server

# Load non-secret config from .env (holds GHCR_OWNER and DB_* variables).
# `set -a` turns every line of .env into an exported variable; `set +a` turns it off.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env                                 # actually read the file into this shell
  set +a
fi

# GHCR_OWNER is needed to build the image name (ghcr.io/<owner>/cicd-backend).
# If it isn't set anywhere, refuse to continue rather than fail confusingly later.
GHCR_OWNER="${GHCR_OWNER:-}"
if [ -z "$GHCR_OWNER" ]; then
  echo "❌ GHCR_OWNER is not set (add it to .env or export it)"
  exit 1
fi
export GHCR_OWNER

# Print what we're about to do so a human can see it clearly.
echo "📦 Backend tag:  $BACKEND_IMAGE_TAG"
echo "📦 Frontend tag: $FRONTEND_IMAGE_TAG"

# Pass the tags to Docker Compose (it reads them as ${BACKEND_IMAGE_TAG} etc.)
echo "⬇️  Pulling images..."
export BACKEND_IMAGE_TAG
export FRONTEND_IMAGE_TAG
docker compose -f docker-compose.prod.yml pull

# Restart only what changed, remove orphan containers, run in the background.
echo "🔄 Starting containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Give the app a few seconds to boot before we poke it.
echo "⏳ Waiting for services to stabilize..."
sleep 10

# ⭐ THE health check: curl our own API; if it isn't HTTP 200, exit with an error
#    so the pipeline knows this deploy DID NOT work.
echo "🏥 Running health checks..."
HEALTH=$(curl -sf http://localhost:8080/api/health) || {
  echo "❌ Health check failed!"
  exit 1
}
echo "✅ Health: $HEALTH"

# Free up disk space by deleting images nothing uses anymore.
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deploy complete!"