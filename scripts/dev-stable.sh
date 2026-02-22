#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

# Ensure Next build output directory exists and is writable by current user.
mkdir -p .next
chmod -R u+rwX,go+rwX .next

exec env NODE_ENV=development next dev --hostname "$HOST" --port "$PORT"
