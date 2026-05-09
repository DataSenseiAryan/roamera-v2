#!/usr/bin/env bash
# =============================================================================
# test-sprint.sh — Sprint Test Orchestrator
#
# Runs the full Roamera V2 test suite in isolation:
#   1. Kills any services already on ports 3001 and 8000
#   2. Starts the API (test DB) and AI service (mock mode)
#   3. Waits for health checks on both services
#   4. Runs vitest (API) + pytest (AI service)
#   5. Prints a summary table and exits 0 (all green) or 1 (any failures)
#
# Usage:
#   ./scripts/test-sprint.sh              # run everything
#   SKIP_SERVICES=1 ./scripts/test-sprint.sh  # skip starting services (if already running)
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/apps/api"
AI_DIR="$ROOT/apps/ai-service"

API_PORT=3001   # test port to avoid clashing with dev server on 3000
AI_PORT=8000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

API_PID=""
AI_PID=""
START_TIME=$(date +%s)

cleanup() {
  echo ""
  echo -e "${YELLOW}Cleaning up test services...${RESET}"
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null && echo "  Killed API (pid $API_PID)"
  [[ -n "$AI_PID" ]]  && kill "$AI_PID"  2>/dev/null && echo "  Killed AI service (pid $AI_PID)"
}
trap cleanup EXIT

kill_port() {
  local port=$1
  local pid
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [[ -n "$pid" ]]; then
    echo -e "  ${YELLOW}Killing existing process on :$port (pid $pid)${RESET}"
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
}

wait_for_health() {
  local name=$1
  local url=$2
  local max_tries=30
  local i=0
  echo -n "  Waiting for $name health check"
  while ! curl -sf "$url" > /dev/null 2>&1; do
    i=$((i + 1))
    if [[ $i -ge $max_tries ]]; then
      echo -e " ${RED}TIMEOUT${RESET}"
      return 1
    fi
    echo -n "."
    sleep 1
  done
  echo -e " ${GREEN}OK${RESET}"
  return 0
}

print_separator() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

echo ""
print_separator
echo -e "${BOLD}  Roamera V2 — Sprint Test Orchestrator${RESET}"
print_separator
echo ""

# ─── 1. Kill existing services ───────────────────────────────────────────────
if [[ "${SKIP_SERVICES:-}" != "1" ]]; then
  echo -e "${CYAN}[1/5] Clearing ports $API_PORT and $AI_PORT...${RESET}"
  kill_port "$API_PORT"
  kill_port "$AI_PORT"
  echo ""
fi

# ─── 2. Start API in test mode ───────────────────────────────────────────────
if [[ "${SKIP_SERVICES:-}" != "1" ]]; then
  echo -e "${CYAN}[2/5] Starting API (test DB on port $API_PORT)...${RESET}"
  (
    cd "$API_DIR"
    DATABASE_URL="file:./data/test.db" \
    PORT="$API_PORT" \
    NODE_ENV="test" \
    JWT_SECRET="test-jwt-secret-for-tests-only-must-be-32chars" \
    JWT_REFRESH_SECRET="test-refresh-secret-for-tests-only-must-be-32chars" \
    AI_SERVICE_URL="http://localhost:$AI_PORT" \
    AI_SERVICE_SECRET="dev-ai-service-secret-change-in-production-32" \
    pnpm tsx src/index.ts > /tmp/roamera-api-test.log 2>&1
  ) &
  API_PID=$!
  echo "  API started (pid $API_PID)"

  # ─── 3. Start AI service in mock mode ──────────────────────────────────────
  echo ""
  echo -e "${CYAN}[3/5] Starting AI service (mock mode on port $AI_PORT)...${RESET}"
  (
    cd "$AI_DIR"
    AI_PROVIDER=mock \
    AI_SERVICE_SECRET="dev-ai-service-secret-change-in-production-32" \
    ./venv/bin/uvicorn src.main:app --port "$AI_PORT" --host 0.0.0.0 \
      > /tmp/roamera-ai-test.log 2>&1
  ) &
  AI_PID=$!
  echo "  AI service started (pid $AI_PID)"

  # ─── 4. Wait for health checks ─────────────────────────────────────────────
  echo ""
  echo -e "${CYAN}[4/5] Health checks...${RESET}"
  wait_for_health "API"        "http://localhost:$API_PORT/api/v1/health"  || {
    echo -e "${RED}API health check failed. Logs:${RESET}"
    tail -30 /tmp/roamera-api-test.log
    exit 1
  }
  wait_for_health "AI service" "http://localhost:$AI_PORT/health" || {
    echo -e "${RED}AI service health check failed. Logs:${RESET}"
    tail -30 /tmp/roamera-ai-test.log
    exit 1
  }
  echo ""
fi

# ─── 5. Run tests ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[5/5] Running test suites...${RESET}"
echo ""

API_PASS=0
API_FAIL=0
AI_PASS=0
AI_FAIL=0
API_TIME=0
AI_TIME=0

# — API tests (vitest) —
echo -e "${BOLD}  → API Tests (vitest + supertest)${RESET}"
API_START=$(date +%s)
set +e
(
  cd "$API_DIR"
  DATABASE_URL="file:./data/test.db" \
  NODE_ENV="test" \
  JWT_SECRET="test-jwt-secret-for-tests-only-must-be-32chars" \
  JWT_REFRESH_SECRET="test-refresh-secret-for-tests-only-must-be-32chars" \
  AI_SERVICE_URL="http://localhost:$AI_PORT" \
  AI_SERVICE_SECRET="dev-ai-service-secret-change-in-production-32" \
  PORT="$API_PORT" \
  pnpm test 2>&1
)
API_EXIT=$?
set -e
API_END=$(date +%s)
API_TIME=$((API_END - API_START))

if [[ $API_EXIT -eq 0 ]]; then
  API_PASS=1
  echo -e "  ${GREEN}✓ API tests passed${RESET} (${API_TIME}s)"
else
  API_FAIL=1
  echo -e "  ${RED}✗ API tests failed${RESET} (${API_TIME}s)"
fi
echo ""

# — AI service tests (pytest) —
echo -e "${BOLD}  → AI Service Tests (pytest)${RESET}"
AI_START=$(date +%s)
set +e
(
  cd "$AI_DIR"
  AI_PROVIDER=mock \
  AI_SERVICE_SECRET="dev-ai-service-secret-change-in-production-32" \
  ./venv/bin/pytest tests/ -v 2>&1
)
AI_EXIT=$?
set -e
AI_END=$(date +%s)
AI_TIME=$((AI_END - AI_START))

if [[ $AI_EXIT -eq 0 ]]; then
  AI_PASS=1
  echo -e "  ${GREEN}✓ AI service tests passed${RESET} (${AI_TIME}s)"
else
  AI_FAIL=1
  echo -e "  ${RED}✗ AI service tests failed${RESET} (${AI_TIME}s)"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
print_separator
echo -e "${BOLD}  Sprint Test Summary${RESET}"
print_separator

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

printf "  %-25s  %-8s  %s\n" "Suite" "Result" "Time"
printf "  %-25s  %-8s  %s\n" "─────────────────────────" "──────" "────"
if [[ $API_FAIL -eq 0 ]]; then
  printf "  %-25s  ${GREEN}%-8s${RESET}  %ss\n" "API (vitest)" "PASS" "$API_TIME"
else
  printf "  %-25s  ${RED}%-8s${RESET}  %ss\n" "API (vitest)" "FAIL" "$API_TIME"
fi
if [[ $AI_FAIL -eq 0 ]]; then
  printf "  %-25s  ${GREEN}%-8s${RESET}  %ss\n" "AI Service (pytest)" "PASS" "$AI_TIME"
else
  printf "  %-25s  ${RED}%-8s${RESET}  %ss\n" "AI Service (pytest)" "FAIL" "$AI_TIME"
fi
print_separator
printf "  %-25s           %ss\n" "Total" "$TOTAL_TIME"
echo ""

TOTAL_FAIL=$((API_FAIL + AI_FAIL))
if [[ $TOTAL_FAIL -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}  ✓ SPRINT PASSED — all test suites green${RESET}"
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}  ✗ SPRINT FAILED — $TOTAL_FAIL suite(s) failed${RESET}"
  echo ""
  echo "  To inspect logs:"
  echo "    API logs:        cat /tmp/roamera-api-test.log"
  echo "    AI service logs: cat /tmp/roamera-ai-test.log"
  echo ""
  exit 1
fi
