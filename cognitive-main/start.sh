#!/usr/bin/env bash
# One-command launcher for macOS / Linux:  ./start.sh
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install the LTS version from https://nodejs.org and re-run."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env - running in local mode. Edit .env to connect Supabase."
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)..."
  npm install --no-audit --no-fund
fi

echo "Starting CognitiveAdapt at http://localhost:3000  (Ctrl+C to stop)"
npm run dev
