#!/bin/bash
#
# Regression Test Suite for Mission Control
# Run before every build to ensure changes don't break existing functionality
#

set -e

echo "🧪 Mission Control Regression Test Suite"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
FAILED=0
PASSED=0

# Function to run a test
run_test() {
    local name=$1
    local command=$2
    
    echo -n "Testing: $name... "
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Error output:"
        tail -5 /tmp/test_output.log | sed 's/^/    /'
        ((FAILED++))
    fi
}

echo "📦 Step 1: Type Checking"
echo "------------------------"
run_test "TypeScript compilation" "npx tsc --noEmit"
echo ""

echo "🔍 Step 2: Linting"
echo "------------------"
run_test "ESLint check" "npm run lint"
echo ""

echo "🧪 Step 3: Unit Tests"
echo "---------------------"
run_test "Unit tests (API)" "npm run test:unit -- --selectProjects unit-api --passWithNoTests"
run_test "Unit tests (Components)" "npm run test:unit -- --selectProjects unit-components --passWithNoTests"
run_test "Unit tests (Hooks)" "npm run test:unit -- --selectProjects unit-hooks --passWithNoTests"
echo ""

echo "🔒 Step 4: Security Checks"
echo "--------------------------"
run_test "No secrets in code" "! grep -r 'sk-proj-' src/ --include='*.ts' --include='*.tsx' || false"
run_test "No console.log in production code" "! grep -r 'console.log' src/app --include='*.tsx' --include='*.ts' | grep -v 'console.warn' | grep -v 'console.error' || false"
echo ""

echo "📊 Step 5: Build Validation"
echo "---------------------------"
run_test "Next.js build" "npm run build"
echo ""

echo "🎯 Step 6: Critical Paths"
echo "-------------------------"
# Check that key files exist
run_test "Mission Control page exists" "test -f src/app/admin/mission-control/page.tsx"
run_test "Activity Feed page exists" "test -f src/app/admin/mission-control/activity/page.tsx"
run_test "Calendar page exists" "test -f src/app/admin/mission-control/calendar/page.tsx"
run_test "useAgents hook exists" "test -f src/hooks/useAgents.ts"
run_test "useActivityFeed hook exists" "test -f src/hooks/useActivityFeed.ts"
run_test "Heartbeat API exists" "test -f src/app/api/agents/heartbeat/route.ts"
echo ""

echo "========================================="
echo "📈 Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo -e "${YELLOW}Failed: $FAILED${NC}"
    echo ""
    echo -e "${GREEN}✅ All regression tests passed!${NC}"
    exit 0
fi
