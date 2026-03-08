#!/usr/bin/env bash
set -euo pipefail

# Required env vars:
#   OPS_ALERT_URL       e.g. https://polybot.uk/api/ops/alert
#   OPS_ALERT_TOKEN     shared secret matching server env
#   MONITOR_SOURCE      e.g. polybot-vps-1
#
# Optional env vars:
#   MONITOR_SERVICE_NAME=polybot-bot.service
#   MONITOR_LOG_FILE=/var/log/polybot/bot.log
#   MONITOR_STATE_FILE=/tmp/polybot-monitor.offset
#   MONITOR_TAIL_LINES=200

if [[ -z "${OPS_ALERT_URL:-}" || -z "${OPS_ALERT_TOKEN:-}" || -z "${MONITOR_SOURCE:-}" ]]; then
  echo "Missing required env vars: OPS_ALERT_URL, OPS_ALERT_TOKEN, MONITOR_SOURCE"
  exit 1
fi

SERVICE_NAME="${MONITOR_SERVICE_NAME:-polybot-bot.service}"
LOG_FILE="${MONITOR_LOG_FILE:-/var/log/polybot/bot.log}"
STATE_FILE="${MONITOR_STATE_FILE:-/tmp/polybot-monitor.offset}"
TAIL_LINES="${MONITOR_TAIL_LINES:-200}"

send_alert() {
  local level="$1"
  local message="$2"
  local details="${3:-}"

  curl -sS -X POST "${OPS_ALERT_URL}" \
    -H "content-type: application/json" \
    -H "x-ops-token: ${OPS_ALERT_TOKEN}" \
    -d "$(printf '{"source":"%s","level":"%s","message":"%s","details":"%s"}' \
      "${MONITOR_SOURCE}" "${level}" "${message}" "${details//\"/\\\"}")" >/dev/null
}

check_service_status() {
  if command -v systemctl >/dev/null 2>&1; then
    if ! systemctl is-active --quiet "${SERVICE_NAME}"; then
      send_alert "critical" "Service appears down" "systemd service '${SERVICE_NAME}' is not active."
    fi
  fi
}

check_log_errors() {
  if [[ ! -f "${LOG_FILE}" ]]; then
    return 0
  fi

  local previous_offset=0
  if [[ -f "${STATE_FILE}" ]]; then
    previous_offset="$(cat "${STATE_FILE}" 2>/dev/null || echo 0)"
  fi

  local current_size
  current_size="$(wc -c < "${LOG_FILE}")"

  if [[ "${previous_offset}" -gt "${current_size}" ]]; then
    previous_offset=0
  fi

  local delta
  delta="$(tail -c +"$((previous_offset + 1))" "${LOG_FILE}" | tail -n "${TAIL_LINES}" || true)"

  if [[ -n "${delta}" ]]; then
    local error_lines
    error_lines="$(printf "%s\n" "${delta}" | rg -i "error|exception|fatal|panic|traceback|unhandled" || true)"
    if [[ -n "${error_lines}" ]]; then
      local excerpt
      excerpt="$(printf "%s\n" "${error_lines}" | tail -n 5 | tr '\n' ' ' | cut -c1-350)"
      send_alert "error" "Error patterns found in log file" "${excerpt}"
    fi
  fi

  printf "%s" "${current_size}" > "${STATE_FILE}"
}

check_service_status
check_log_errors
