# 🚀 Quick Start Guide - AWE2M8 Testing Framework

## Choose Your Setup (Pick One)

### 🌐 Option 1: Browser Testing (No Setup Required)

**Best for:** Quick checks, visual feedback

1. Open `test-suite.html` in Chrome/Edge
2. Click "Run All Tests"
3. Done! ✅

---

### 💻 Option 2: Command Line + Pre-Commit Hook (Recommended)

**Best for:** Automation, preventing broken commits

**5-Minute Setup:**

```bash
# 1. Copy files to your project root
cp test-runner.js package.json pre-commit /path/to/your/project/

# 2. Setup the pre-commit hook
npm run setup:hooks

# 3. Test it works
npm test
```

**That's it!** Now tests run automatically before every commit.

---

### ⚙️ Option 3: Full CI/CD with GitHub Actions

**Best for:** Team projects, production deployments

**Setup:**

```bash
# 1. Create GitHub Actions directory
mkdir -p .github/workflows/

# 2. Copy the workflow file
cp github-workflow-test.yml .github/workflows/test.yml

# 3. Commit and push
git add .github/workflows/test.yml
git commit -m "Add automated testing"
git push
```

**Now:** Tests run automatically on every push and pull request!

---

## Daily Usage

### Before You Commit
```bash
npm test              # Run all tests
npm run test:quick    # Run quick tests only
```

### If Tests Fail
1. Read the error message (it tells you exactly what's wrong)
2. Fix the issue
3. Run tests again
4. Commit when green ✅

### Emergency Bypass (Use Sparingly!)
```bash
git commit --no-verify -m "your message"
```

---

## Common Issues

**"content.json not found"**
- Solution: Run tests from your project root directory

**"Tests passed but commit blocked"**
- Solution: Make sure pre-commit hook is executable: `chmod +x .git/hooks/pre-commit`

**"Need to skip tests just this once"**
- Solution: Use `git commit --no-verify` (but fix the issues ASAP!)

---

## What Gets Tested?

✅ **JSON Structure** - Is your content.json valid?
✅ **Required Fields** - Are all critical fields filled in?
✅ **URL Validation** - Are all URLs properly formatted?
✅ **Integration** - Do your pages have the data they need?

---

## Next Steps

1. **Choose a setup option above** (Option 2 recommended)
2. **Run your first test**: `npm test`
3. **Read TESTING-README.md** for full documentation
4. **Start committing with confidence!** 🎉

---

## Support

- 📖 Full docs: See TESTING-README.md
- 🐛 Issues: Check the console output - it's very descriptive
- 💡 Questions: Tests are self-explanatory with clear error messages

---

**Pro Tip:** Start with "Option 1: Browser Testing" to see how it works, then upgrade to "Option 2: Command Line" for the pre-commit hook. It's game-changing!
