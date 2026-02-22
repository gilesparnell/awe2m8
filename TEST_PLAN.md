# Mission Control v3 - Test Plan
**QA Oversight:** Beldin (The Cynic) - CEO Review Required
**Approach:** Test-First Development - Tests before Code
**Status:** Draft - Pending Beldin Approval

## TESTING PHILOSOPHY

**"If it ain't tested, it ain't done"** - Beldin's First Law
**"Assume everything will break"** - Beldin's Second Law
**"Users are more creative at breaking things than you are at building them"** - Beldin's Third Law

## TEST CATEGORIES

### 1. UNIT TESTS - Critical Functions
**Coverage Target:** 95% of critical paths

#### Cost Tracking Tests (HIGHEST PRIORITY)
```javascript
describe('Cost Tracking', () => {
  it('should calculate agent costs accurately', () => {
    // Test: Barak + 1000 tokens = $0.023
    // Test: Silk + 2000 tokens = $0.046
    // Test: Polgara + 500 tokens = $0.0115
  });

  it('should enforce daily budgets', () => {
    // Test: Reject task when budget exceeded
    // Test: Allow task when budget available
    // Test: Edge case: exactly at budget limit
  });

  it('should aggregate costs correctly', () => {
    // Test: Multiple activities same day
    // Test: Cross-day cost tracking
    // Test: Month boundary handling
  });

  it('should handle cost overflow', () => {
    // Test: Very large numbers
    // Test: Negative costs (refunds?)
    // Test: Decimal precision (2 places max)
  });
});
```

#### Agent Management Tests
```javascript
describe('Agent Spawning', () => {
  it('should validate agent ID', () => {
    // Test: Invalid agent ID rejected
    // Test: Case sensitivity
    // Test: SQL injection attempts
  });

  it('should handle spawn failures', () => {
    // Test: Firebase connection lost
    // Test: Rate limiting
    // Test: Invalid task format
  });

  it('should track agent lifecycle', () => {
    // Test: Spawn → Working → Complete
    // Test: Spawn → Failed → Error state
    // Test: Timeout handling (4hr max)
  });
});
```

### 2. INTEGRATION TESTS - Firebase & APIs
**Coverage Target:** All Firebase operations

#### Firestore Security Tests
```javascript
describe('Security Rules', () => {
  it('should prevent unauthorized access', () => {
    // Test: Unauthenticated user denied
    // Test: Wrong user ID rejected
    // Test: Admin escalation only for admins
  });

  it('should validate data formats', () => {
    // Test: Invalid task structure rejected
    // Test: Malicious code in descriptions
    // Test: Oversized data rejected
  });
});
```

#### Real-time Updates Tests
```javascript
describe('Real-time Features', () => {
  it('should handle connection drops', () => {
    // Test: Firebase disconnect → reconnect
    // Test: Data sync after reconnect
    // Test: No duplicate events
  });

  it('should manage listener lifecycle', () => {
    // Test: Component unmount → listeners cleaned
    // Test: Page navigation → no memory leaks
    // Test: Multiple components sharing data
  });
});
```

### 3. E2E TESTS - User Flows
**Coverage Target:** All critical user journeys

#### Core User Stories
```gherkin
Feature: Task Management
  Scenario: Create and complete a task
    Given I am on the task board
    When I click "Create Task"
    And I fill in task details
    And I assign to Barak
    And I click "Create"
    Then I see the task in "To Do"
    When Barak completes the task
    Then I see it move to "Done"
    And I see the cost in activity feed

  Scenario: Budget enforcement
    Given Barak has $0.10 remaining budget
    When I try to assign a $0.20 task
    Then I see "Budget exceeded" error
    And the task is not created
```

#### Settings Management
```gherkin
Feature: Settings - Squad Showcase
  Scenario: View agent details
    Given I am on Settings > Squad page
    Then I see all 10 agent cards
    And each card has avatar image
    And each card shows core function
    And each card shows edit button

  Scenario: Edit agent SOUL
    When I click "Edit SOUL" on Barak's card
    Then I see SOUL editor
    When I make changes
    And I click "Save"
    Then changes are persisted
    And I see success notification
```

### 4. MOBILE-SPECIFIC TESTS
**Devices:** iPhone SE, iPhone 14, Pixel 7, Galaxy S23

#### Touch Interactions
```javascript
describe('Mobile Touch', () => {
  it('should handle drag & drop on mobile', () => {
    // Test: Touch drag task cards
    // Test: Prevent accidental drops
    // Test: Scroll vs drag distinction
  });

  it('should optimize for thumb reach', () => {
    // Test: Primary actions in thumb zone
    // Test: No critical actions at top corners
    // Test: Bottom sheet for complex actions
  });
});
```

#### Performance Tests
```javascript
describe('Mobile Performance', () => {
  it('should load under 3 seconds on 3G', () => {
    // Test: Initial load time
    // Test: Avatar lazy loading
    // Test: JavaScript bundle size <500KB
  });

  it('should work offline', () => {
    // Test: Offline task creation
    // Test: Queue sync when online
    // Test: Conflict resolution
  });
});
```

### 5. SECURITY TESTS
**Priority:** CRITICAL - Must pass before launch

#### Input Validation
```javascript
describe('Input Security', () => {
  it('should sanitize all user inputs', () => {
    // Test: XSS in task descriptions
    // Test: SQL injection in search
    // Test: Path traversal in file paths
  });

  it('should validate file uploads', () => {
    // Test: Only .md files allowed
    // Test: File size limits (1MB max)
    // Test: Malicious file content
  });
});
```

#### Authentication Tests
```javascript
describe('Authentication', () => {
  it('should handle session expiry', () => {
    // Test: Token refresh
    // Test: Graceful logout
    // Test: Redirect to login
  });

  it('should prevent privilege escalation', () => {
    // Test: Regular user can't access admin
    // Test: Can't modify other users' tasks
    // Test: Rate limiting on login attempts
  });
});
```

### 6. PERFORMANCE TESTS
**Benchmarks:**
- Page load: <2 seconds on desktop
- Page load: <3 seconds on mobile (3G)
- Task creation: <5 seconds end-to-end
- Real-time updates: <1 second delay

#### Load Testing
```javascript
describe('Load Testing', () => {
  it('should handle 100 simultaneous tasks', () => {
    // Test: Create 100 tasks at once
    // Test: All tasks appear in UI
    // Test: No Firebase timeouts
  });

  it('should handle 1000 activities', () => {
    // Test: Activity feed with 1000 items
    // Test: Pagination works
    // Test: No UI freezing
  });
});
```

## TEST DATA & FIXTURES

### Mock Data Setup
```javascript
const testAgents = [
  { id: 'barak', name: 'Barak', dailyBudget: 5.00 },
  { id: 'silk', name: 'Silk', dailyBudget: 3.00 },
  // ... all 10 agents
];

const testTasks = [
  { title: 'Research competitors', agent: 'barak', estimatedCost: 0.50 },
  { title: 'Write code', agent: 'silk', estimatedCost: 0.30 },
];
```

### Test Environment Setup
```bash
# Firebase Emulator
firebase emulators:start --only firestore,functions

# Test Database
npm run test:setup # Creates test collections

# Clean State
npm run test:clean # Removes all test data
```

## TEST EXECUTION PLAN

### Daily Testing (During Development)
- Unit tests on every commit
- Integration tests on every PR
- E2E tests on staging deploy

### Pre-Release Testing
1. **Week -2:** Complete test suite run
2. **Week -1:** Security audit & performance testing
3. **Week 0:** Final regression testing

### Continuous Testing
- Automated tests on CI/CD pipeline
- Daily cost tracking validation
- Weekly security scan
- Monthly performance benchmark

## SUCCESS CRITERIA

### Must Pass Before Launch:
- [ ] All unit tests green (95% coverage)
- [ ] All integration tests green
- [ ] All E2E tests green
- [ ] Security tests pass
- [ ] Performance benchmarks met
- [ ] Mobile tests on all devices
- [ ] Cost tracking accuracy: 100%

### Beldin's Sign-off Required:
- [ ] "This won't blow up in production"
- [ ] "Users can't break it easily"
- [ ] "Costs are accurate to the penny"
- [ ] "Security is bulletproof"
- [ ] "Performance won't embarrass us"

## TEST AUTOMATION

### CI/CD Pipeline
```yaml
test-pipeline:
  - unit-tests
  - integration-tests
  - security-scan
  - performance-test
  - mobile-test
  - e2e-test
  - beldin-review # Manual approval required
```

### Monitoring Tests (Post-Launch)
- Daily cost accuracy checks
- Weekly performance benchmarks
- Monthly security audits
- User behavior anomaly detection

## NEXT STEPS

1. **Immediate:** Set up test environment
2. **Week 0:** Write Phase 0 cost tracking tests first
3. **Ongoing:** Tests before code for every feature
4. **Continuous:** Update tests as features evolve

**Beldin's Final Word:** "If any test fails, we don't ship. Period."