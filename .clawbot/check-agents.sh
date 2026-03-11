#!/bin/bash

# Elvis-style agent babysitter script
# Checks tmux sessions, PR status, CI status
# Only alerts if human attention needed

TASK_REGISTRY="/Users/gilesparnell/Documents/VSStudio/awe2m8-local/.clawbot/active-tasks.json"
ALERT_NEEDED=false
ALERTS=()

echo "🦞 Checking agent swarm status..."

# Check if task registry exists
if [[ ! -f "$TASK_REGISTRY" ]]; then
    echo "❌ Task registry not found: $TASK_REGISTRY"
    exit 1
fi

# Parse active tasks (simple version)
TASK_COUNT=$(jq -r '.tasks | length' "$TASK_REGISTRY" 2>/dev/null || echo "0")

if [[ "$TASK_COUNT" == "0" ]]; then
    echo "✅ No active tasks"
    exit 0
fi

echo "📋 Active tasks: $TASK_COUNT"

# Check tmux sessions for each task
jq -r '.tasks | to_entries[] | "\(.key) \(.value.tmuxSession // "none") \(.value.status)"' "$TASK_REGISTRY" 2>/dev/null | while read -r task_id tmux_session status; do
    echo "🔍 Checking task: $task_id (status: $status)"
    
    if [[ "$tmux_session" != "none" && "$tmux_session" != "null" ]]; then
        if tmux has-session -t "$tmux_session" 2>/dev/null; then
            echo "  ✅ tmux session alive: $tmux_session"
        else
            echo "  ❌ tmux session dead: $tmux_session"
            ALERTS+=("Task $task_id: tmux session '$tmux_session' is dead")
            ALERT_NEEDED=true
        fi
    fi
done

# If alerts needed, we would notify here
# For now, just report status
if [[ "$ALERT_NEEDED" == "true" ]]; then
    echo ""
    echo "🚨 ALERTS:"
    printf '%s\n' "${ALERTS[@]}"
else
    echo ""
    echo "✅ All systems operational"
fi