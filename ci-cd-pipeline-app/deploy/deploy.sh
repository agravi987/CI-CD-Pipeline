#!/usr/bin/env bash
#
# deploy.sh — Generic deploy helper for SSH-based deployment
#
# Usage:
#   ./deploy.sh <BACKEND_IMAGE_TAG> <FRONTEND_IMAGE_TAG> [COMPOSE_DIR]
#
# Example:
#   ./deploy.sh sha-abc1234 sha-abc1234 /opt/cicd-production
#
set -euo pipefail

BACKEND_IMAGE_TAG="${1:?Usage: deploy.sh <backend-tag> <frontend-tag> [compose-dir]}"
FRONTEND_IMAGE_TAG="${2:?Usage: deploy.sh <backend-tag> <frontend-tag> [compose-dir]}"
COMPOSE_DIR="${3:-/opt/cicd-production}"

cd "$COMPOSE_DIR"

# Load non-secret vars (.env holds POSTGRES_*/DB_* too — compose reads it anyway)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Image owner (required for the GHCR image name). Default to an env var or .env.
GHCR_OWNER="${GHCR_OWNER:-}"
if [ -z "$GHCR_OWNER" ]; then
  echo "❌ GHCR_OWNER is not set (add it to .env or export it)"
  exit 1
fi
export GHCR_OWNER

echo "📦 Backend tag:  $BACKEND_IMAGE_TAG"
echo "📦 Frontend tag: $FRONTEND_IMAGE_TAG"

echo "⬇️  Pulling images..."
export BACKEND_IMAGE_TAG
export FRONTEND_IMAGE_TAG
docker compose -f docker-compose.prod.yml pull

echo "🔄 Starting containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "⏳ Waiting for services to stabilize..."
sleep 10

echo "🏥 Running health checks..."
HEALTH=$(curl -sf http://localhost:8080/api/health) || {
  echo "❌ Health check failed!"
  exit 1
}
echo "✅ Health: $HEALTH"

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deploy complete!"
