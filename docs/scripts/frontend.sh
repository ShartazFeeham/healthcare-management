#!/usr/bin/env bash
# Build and serve the React frontend on http://localhost:3100 (a static server, no dev toolchain at runtime).
#   frontend.sh build    install dependencies if needed and create the production build
#   frontend.sh up       start the static server (builds first if no build exists)
#   frontend.sh down     stop it
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
RUN="$ROOT/docs/.run"; mkdir -p "$RUN/logs" "$RUN/pids"
PORT="${FRONTEND_PORT:-3100}"
case "${1:-}" in
  build)
    cd "$ROOT/FrontEnd"
    [[ -d node_modules ]] || npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps
    CI=false GENERATE_SOURCEMAP=false npm run build ;;
  up)
    [[ -f "$ROOT/FrontEnd/build/index.html" ]] || "$0" build || exit 1
    if curl -s -o /dev/null -m 2 "http://localhost:$PORT"; then echo "  = frontend already up (:$PORT)"; exit 0; fi
    cd "$ROOT"; nohup node docs/scripts/serve-static.js FrontEnd/build "$PORT" > "$RUN/logs/frontend.log" 2>&1 &
    echo $! > "$RUN/pids/frontend.pid"; sleep 1; echo "  ✓ frontend (:$PORT)" ;;
  down)
    [[ -f "$RUN/pids/frontend.pid" ]] && kill "$(cat "$RUN/pids/frontend.pid")" 2>/dev/null; rm -f "$RUN/pids/frontend.pid"; echo "frontend stopped" ;;
  *) sed -n '2,6p' "$0" ;;
esac
