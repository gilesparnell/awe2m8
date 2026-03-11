#!/bin/bash

# Simple visual dashboard for agent swarm
clear
echo "🦞 AGENT SWARM DASHBOARD"
echo "=========================="
echo ""

TASK_REGISTRY="/Users/gilesparnell/Documents/VSStudio/awe2m8-local/.clawbot/active-tasks.json"

# Summary
TOTAL=$(jq -r '.tasks | length' "$TASK_REGISTRY" 2>/dev/null || echo "0")
TODO=$(jq -r '.tasks | map(select(.status == "todo")) | length' "$TASK_REGISTRY" 2>/dev/null || echo "0")
INFLIGHT=$(jq -r '.tasks | map(select(.status == "spawning" or .status == "running")) | length' "$TASK_REGISTRY" 2>/dev/null || echo "0")
DONE=$(jq -r '.tasks | map(select(.status == "done" or .status == "completed")) | length' "$TASK_REGISTRY" 2>/dev/null || echo "0")

echo "📊 SUMMARY:"
echo "  Total Tasks: $TOTAL"
echo "  📋 To Do:    $TODO"
echo "  🚀 In Flight: $INFLIGHT"
echo "  ✅ Done:     $DONE"
echo ""

# Active tasks detail
echo "🔥 IN FLIGHT:"
jq -r '.tasks | to_entries[] | select(.value.status == "spawning" or .value.status == "running") | "  • \(.value.agent | ascii_upcase): \(.value.description)"' "$TASK_REGISTRY" 2>/dev/null

echo ""
echo "⏱️  Updated: $(date)"
echo ""
echo "Run: ./.clawbot/dashboard.sh"