#!/usr/bin/env bash
# Build / start / stop / inspect the Spring Boot microservices. Fully local.
#   backend.sh build [module...]   build bootJars (needs Maven Central once; cached afterwards)
#   backend.sh up                  start every service in dependency order and wait for health
#   backend.sh down                stop every service
#   backend.sh status              show which ports are answering
#   backend.sh restart <name>      restart one service (e.g. account)
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
source "$HERE/services.sh"
RUN="$ROOT/docs/.run"; mkdir -p "$RUN/logs" "$RUN/pids" "$RUN/storage"
JAVA_OPTS_DEFAULT="-Xms64m -Xmx256m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Dspring.main.banner-mode=off"
export DB_HOST="${DB_HOST:-localhost}" DB_PORT="${DB_PORT:-3306}"
export HC_CONFIG_DIR="${HC_CONFIG_DIR:-$ROOT/BackEnd/Configurations}"
export HC_STORAGE_DIR="${HC_STORAGE_DIR:-$RUN/storage}"

jar_of() { ls "$ROOT/BackEnd/$1/build/libs/"*.jar 2>/dev/null | grep -v plain | head -1; }

health() { # 0 when the port answers any HTTP response
  local code; code=$(curl -s -o /dev/null -m 2 -w '%{http_code}' "http://localhost:$1/actuator/health" 2>/dev/null)
  [[ "$code" != "000" && -n "$code" ]]
}

start_one() {
  local name="$1" dir="$2" port="$3" jar; jar="$(jar_of "$dir")"
  [[ -z "$jar" ]] && { echo "  ! $name: no jar, run 'backend.sh build' first"; return 1; }
  if health "$port"; then echo "  = $name already up (:$port)"; return 0; fi
  # cd in a subshell, then background java itself so $! is the JVM's pid (needed for 'down').
  ( cd "$ROOT/BackEnd/$dir"; nohup java ${JAVA_OPTS:-$JAVA_OPTS_DEFAULT} -jar "$jar" > "$RUN/logs/$name.log" 2>&1 &
    echo $! > "$RUN/pids/$name.pid" )
  local i=0
  while ! health "$port"; do
    sleep 2; i=$((i+1))
    if ! kill -0 "$(cat "$RUN/pids/$name.pid")" 2>/dev/null; then echo "  ✗ $name died, see docs/.run/logs/$name.log"; return 1; fi
    [[ $i -gt 90 ]] && { echo "  ✗ $name not healthy after 180s"; return 1; }
  done
  echo "  ✓ $name (:$port)"
}

stop_one() {
  local name="$1" f="$RUN/pids/$1.pid"
  if [[ -f "$f" ]]; then
    local pid; pid="$(cat "$f")"; kill "$pid" 2>/dev/null
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    kill -9 "$pid" 2>/dev/null; rm -f "$f"
  fi
}

case "${1:-}" in
  build)
    shift; mods=("$@"); [[ ${#mods[@]} -eq 0 ]] && for s in "${HC_SERVICES[@]}"; do IFS=: read -r _ d _ <<<"$s"; mods+=("$d"); done
    for d in "${mods[@]}"; do echo "== build $d"; (cd "$ROOT/BackEnd/$d" && ./gradlew bootJar -x test --console=plain -q) || exit 1; done ;;
  up)
    for s in "${HC_SERVICES[@]}"; do IFS=: read -r n d p <<<"$s"; start_one "$n" "$d" "$p" || true; done ;;
  down)
    for ((i=${#HC_SERVICES[@]}-1;i>=0;i--)); do IFS=: read -r n _ _ <<<"${HC_SERVICES[$i]}"; stop_one "$n"; done; echo "stopped" ;;
  restart)
    for s in "${HC_SERVICES[@]}"; do IFS=: read -r n d p <<<"$s"; if [[ "$n" == "$2" ]]; then stop_one "$n"; sleep 2; start_one "$n" "$d" "$p"; fi; done ;;
  status)
    for s in "${HC_SERVICES[@]}"; do IFS=: read -r n _ p <<<"$s"; if health "$p"; then echo "UP    $n :$p"; else echo "DOWN  $n :$p"; fi; done ;;
  *) sed -n '2,8p' "$0" ;;
esac
