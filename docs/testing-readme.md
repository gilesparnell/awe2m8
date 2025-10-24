# AWE2M8 Testing Framework

A comprehensive testing suite to ensure code quality and catch bugs before they reach production.

## 📋 Overview

This testing framework provides:
- ✅ **JSON validation** - Ensures content.json is valid and complete
- ✅ **Data integrity checks** - Verifies all required fields are present
- ✅ **URL validation** - Checks that all URLs are properly formatted
- ✅ **Integration tests** - Validates that pages have the data they need
- ✅ **Pre-commit hooks** - Automatically runs tests before Git commits
- ✅ **CI/CD ready** - Can be integrated into GitHub Actions

## 🚀 Quick Start

### Option 1: Browser-Based Testing (Easiest)

1. Open `test-suite.html` in your browser
2. Click "▶️ Run All Tests" or "⚡ Quick Tests Only"
3. Review results
4. Export report if needed

**Perfect for:** Quick checks, visual feedback, no setup required

### Option 2: Command-Line Testing (Recommended for CI/CD)

1. Make sure you have Node.js installed
2. Run from your project root:
   ```bash
   node test-runner.js
   ```
3. For quick tests only:
   ```bash
   node test-runner.js --quick
   ```

**Perfect for:** Pre-commit checks, automation, CI/CD pipelines

## 🔧 Installation

### Setting Up the Pre-Commit Hook

Automatically run tests before every Git commit:

```bash
# 1. Copy the pre-commit hook
cp pre-commit .git/hooks/pre-commit

# 2. Make it executable
chmod +x .git/hooks/pre-commit

# 3. Test it works
git commit -m "test commit" --dry-run
```

Now tests will run automatically before each commit. If tests fail, the commit will be blocked.

**To bypass the hook** (not recommended):
```bash
git commit --no-verify -m "your message"
```

### Setting Up GitHub Actions (CI/CD)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Run Tests
      run: node test-runner.js
    
    - name: Upload Test Report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-report
        path: test-report-*.json
```

## 📊 Test Categories

### JSON Structure Tests (Quick)
- Validates content.json exists and is accessible
- Checks JSON is valid and parseable
- Verifies required top-level structure
- Ensures industries object exists
- Confirms required industries are present

### Data Integrity Tests (Quick)
- Validates all industry pages have required fields
- Checks all URLs are valid format
- Ensures no empty critical fields
- Validates emoji fields contain valid emojis

### Integration Tests (Quick)
- Fire Safety page has complete data
- Gyms page has complete data
- Content editor can read JSON

### Link Validation Tests (Slow)
- SMS demo links are accessible
- Orb iframe URLs are valid
- Video URLs are accessible

## 🎯 Test Output

### Success Output
```
════════════════════════════════════════════════
       🧪 AWE2M8 Test Suite - CLI Version       
════════════════════════════════════════════════

▼ JSON Structure Tests
  ✓ content.json exists and is accessible
    → Found at: ./content/content.json
  ✓ JSON is valid and parseable
    → JSON is valid and parseable
  ✓ Required top-level structure exists
    → 9 top-level keys found

═══════════════ TEST SUMMARY ═══════════════
Total Tests:    15
✓ Passed:       15
✗ Failed:       0
⚠ Warnings:     0

Pass Rate:      100.0%

════════════════════════════════════════════════
  ✓✓✓ ALL CRITICAL TESTS PASSED - SAFE TO COMMIT ✓✓✓
════════════════════════════════════════════════
```

### Failure Output
```
▼ Data Integrity Tests
  ✗ All industry pages have required fields
    → Missing or empty fields: fireSafety.smsAgentDemoUrl

═══════════════ TEST SUMMARY ═══════════════
Total Tests:    15
✓ Passed:       14
✗ Failed:       1
⚠ Warnings:     0

Pass Rate:      93.3%

════════════════════════════════════════════════
  ✗✗✗ CRITICAL TESTS FAILED - DO NOT COMMIT ✗✗✗
════════════════════════════════════════════════
```

## 🛠️ Configuration

Edit the test configuration in both `test-suite.html` and `test-runner.js`:

```javascript
const testConfig = {
    contentJsonPath: './content/content.json',
    requiredIndustries: ['fireSafety', 'gyms'],
    requiredDemos: ['voiceAI', 'aiReceptionist', 'databaseReactivation'],
    criticalFields: {
        industry: ['pageTitle', 'heroTitle', 'heroSubtitle', 'solution1Title', 'smsAgentDemoUrl'],
        demo: ['title', 'emoji', 'heroDescription']
    }
};
```

### Adding New Tests

1. Create a test function:
```javascript
function testMyNewFeature() {
    // Your test logic
    if (/* something is wrong */) {
        return { pass: false, message: 'What went wrong' };
    }
    return { pass: true, message: 'All good!' };
}
```

2. Add it to a category:
```javascript
{
    name: 'My Test Category',
    quick: true,  // Set to false for slow tests
    tests: [
        { name: 'My new test', fn: testMyNewFeature }
    ]
}
```

## 📝 Best Practices

### When to Run Tests

- ✅ **Before every commit** - Use the pre-commit hook
- ✅ **After making changes** - Run quick tests manually
- ✅ **Before pushing to GitHub** - Run full test suite
- ✅ **During pull requests** - Automated via GitHub Actions

### Test Development Workflow

1. Make changes to your code
2. Run quick tests: `node test-runner.js --quick`
3. Fix any failures
4. Run full tests: `node test-runner.js`
5. Commit with confidence
6. Push to GitHub

### Exit Codes

The test runner returns standard exit codes:
- `0` = All tests passed (safe to commit)
- `1` = Tests failed (do not commit)

This makes it perfect for CI/CD pipelines and pre-commit hooks.

## 🐛 Troubleshooting

### "content.json not found"
**Problem:** Test can't find your content.json file
**Solution:** Make sure you're running tests from the project root, or update the path in test config

### "Module not found"
**Problem:** Node.js can't find required modules
**Solution:** The test runner uses only Node.js built-in modules, no installation needed

### Pre-commit hook not running
**Problem:** Git isn't running the tests
**Solution:** 
```bash
chmod +x .git/hooks/pre-commit
cat .git/hooks/pre-commit  # Verify contents
```

### Tests pass locally but fail in GitHub Actions
**Problem:** Environment differences
**Solution:** Check file paths are relative, not absolute

## 📈 Future Enhancements

Potential additions to the testing framework:
- [ ] Visual regression testing for HTML pages
- [ ] Performance benchmarking
- [ ] Accessibility (a11y) testing
- [ ] Link checking with actual HTTP requests
- [ ] Screenshot comparison
- [ ] Load testing for demo endpoints

## 🤝 Contributing

When adding new features to the project:
1. Add corresponding tests
2. Run the full test suite
3. Update this README if needed
4. Ensure all tests pass before submitting PR

## 📄 License

Part of the AWE2M8 project.

---

**Questions?** Check the test output messages for specific guidance on what needs to be fixed.