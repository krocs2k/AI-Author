#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Startup database schema sync
# ---------------------------------------------------------------------------
# On self-hosted deployments the runtime database is separate from the build
# environment, so newly added tables/columns (e.g. GoogleSSOConfig, LLMConfig
# fields, Series, StoryBible, etc.) must be created in the live database before
# the server starts. `prisma db push` makes the database match the schema
# without requiring migration files.
#
# It is run WITHOUT --accept-data-loss so it can only make additive/safe
# changes; if it would require a destructive change it exits non-zero and we
# still start the server (login/credentials continue to work).
# ---------------------------------------------------------------------------

echo "[entrypoint] Syncing database schema (prisma db push)..."
if node node_modules/prisma/build/index.js db push --skip-generate --schema=./prisma/schema.prisma; then
  echo "[entrypoint] Database schema is up to date."
else
  echo "[entrypoint] WARNING: prisma db push did not complete cleanly. Starting server anyway."
fi

echo "[entrypoint] Starting server..."
exec node server.js
