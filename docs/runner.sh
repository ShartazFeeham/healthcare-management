#!/usr/bin/env bash
# One entry point for the whole local environment. Everything runs on this machine, no cloud services.
#   ./runner.sh            interactive menu
#   ./runner.sh 1..5|s|x   run one option directly (cleanup, setup, run, seed, all, status, stop)
set -uo pipefail
DOCS="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$DOCS/.." && pwd)"
S="$DOCS/scripts"
bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✗ %s\033[0m\n' "$*"; exit 1; }

need_docker() {
  command -v docker >/dev/null || die "docker is not installed"
  if ! docker info >/dev/null 2>&1; then
    warn "Docker is not running, starting Docker Desktop..."
    open -a Docker 2>/dev/null || true
    for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 2; done
    docker info >/dev/null 2>&1 || die "Docker did not start"
  fi
}

# 1. ------------------------------------------------------------------------------------------
cleanup() {
  bold "1) Cleanup: stop everything, remove the database container and its volume"
  "$S/frontend.sh" down 2>/dev/null
  "$S/backend.sh" down 2>/dev/null
  if command -v docker >/dev/null && docker info >/dev/null 2>&1; then
    (cd "$DOCS/docker" && docker compose down -v --remove-orphans 2>&1 | sed 's/^/  /')
  fi
  rm -rf "$DOCS/.run" "$DOCS/seeder/last-run.json"
  ok "containers, volume, logs, uploaded files and local run state removed"
}

# 2. ------------------------------------------------------------------------------------------
setup() {
  bold "2) Setup: MySQL container, backend jars, frontend build"
  need_docker
  (cd "$DOCS/docker" && docker compose up -d --wait 2>&1 | sed 's/^/  /') || die "database container failed to start"
  ok "MySQL 8.4 on 127.0.0.1:3306 (databases created by docker/init/01-databases.sql)"
  missing=0
  for d in "$ROOT"/BackEnd/*/; do [[ -f "$d/build.gradle" && -z "$(ls "$d"build/libs/*.jar 2>/dev/null)" ]] && missing=1; done
  if [[ $missing -eq 1 ]]; then echo "  building backend services (first time downloads dependencies from Maven Central once)..."; "$S/backend.sh" build || die "backend build failed"; fi
  ok "backend services built"
  [[ -f "$ROOT/FrontEnd/build/index.html" ]] || { echo "  building frontend..."; "$S/frontend.sh" build >/dev/null 2>&1 || die "frontend build failed"; }
  ok "frontend built"
}

# 3. ------------------------------------------------------------------------------------------
run() {
  bold "3) Run: 15 backend services + frontend"
  need_docker
  docker ps --format '{{.Names}}' | grep -q '^healthcare-mysql$' || die "database is not running, choose option 2 first"
  "$S/backend.sh" up
  "$S/frontend.sh" up
  echo; bold "  App           http://localhost:3100"
  echo "  Eureka        http://localhost:8761"
  echo "  Local mailbox http://localhost:3100/common/mailbox  (OTP codes and notifications land here)"
}

# 4. ------------------------------------------------------------------------------------------
seed() {
  bold "4) Seed: realistic demo data through the real APIs"
  command -v node >/dev/null || die "node is not installed"
  node "$DOCS/seeder/seed.mjs" "$@"
}

all() { cleanup; setup; run; seed; echo; bold "Ready. Open http://localhost:3100"; }

status() { "$S/backend.sh" status; curl -s -o /dev/null -m 2 http://localhost:3100 && echo "UP    frontend :3100" || echo "DOWN  frontend :3100"; docker ps --filter name=healthcare-mysql --format 'MySQL: {{.Status}}' 2>/dev/null; }
stop()   { "$S/frontend.sh" down; "$S/backend.sh" down; }

menu() {
  cat <<MENU

  EA Healthcare - local environment
  ---------------------------------
  1) Cleanup     remove docker containers, DB container and volumes
  2) Setup       start docker + database, build services
  3) Run         start backend and frontend
  4) Seed        fill the system with realistic data
  5) Automate    1 -> 2 -> 3 -> 4
  s) Status      x) Stop services      q) Quit
MENU
}

dispatch() { case "$1" in 1|cleanup) cleanup;; 2|setup) setup;; 3|run) run;; 4|seed) shift; seed "$@";; 5|all) all;; s|status) status;; x|stop) stop;; q|quit) exit 0;; *) echo "unknown option: $1";; esac; }

if [[ $# -gt 0 ]]; then dispatch "$@"; else
  while true; do menu; read -r -p "  choose: " choice; dispatch "$choice"; done
fi
