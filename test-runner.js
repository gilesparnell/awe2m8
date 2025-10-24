#!/usr/bin/env node

/**
 * AWE2M8 Test Suite - CLI Version
 * Run this before committing to GitHub
 * Usage: node test-runner.js [--quick]
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test Configuration
const config = {
    contentJsonPath: './content/content.json',
    requiredIndustries: ['fireSafety', 'gyms'],
    requiredDemos: ['voiceAI', 'aiReceptionist', 'databaseReactivation'],
    criticalFields: {
        industry: ['pageTitle', 'heroTitle', 'heroSubtitle', 'solution1Title', 'smsAgentDemoUrl'],
        demo: ['title', 'emoji', 'heroDescription']
    }
};

let contentData = null;
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    categories: []
};

// ===== UTILITY FUNCTIONS =====

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader() {
    console.log('');
    log('════════════════════════════════════════════════', 'cyan');
    log('       🧪 AWE2M8 Test Suite - CLI Version       ', 'bright');
    log('════════════════════════════════════════════════', 'cyan');
    console.log('');
}

function printSummary() {
    console.log('');
    log('═══════════════ TEST SUMMARY ═══════════════', 'cyan');
    console.log('');
    log(`Total Tests:    ${testResults.total}`, 'bright');
    log(`✓ Passed:       ${testResults.passed}`, 'green');
    log(`✗ Failed:       ${testResults.failed}`, 'red');
    log(`⚠ Warnings:     ${testResults.warnings}`, 'yellow');
    console.log('');

    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    log(`Pass Rate:      ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');
    console.log('');

    if (testResults.failed === 0) {
        log('════════════════════════════════════════════════', 'green');
        log('  ✓✓✓ ALL CRITICAL TESTS PASSED - SAFE TO COMMIT ✓✓✓  ', 'green');
        log('════════════════════════════════════════════════', 'green');
        return 0; // Exit code 0 = success
    } else {
        log('════════════════════════════════════════════════', 'red');
        log('  ✗✗✗ CRITICAL TESTS FAILED - DO NOT COMMIT ✗✗✗  ', 'red');
        log('════════════════════════════════════════════════', 'red');
        return 1; // Exit code 1 = failure
    }
}

function printCategoryHeader(name) {
    console.log('');
    log(`▼ ${name}`, 'blue');
}

function printTestResult(name, result) {
    const icon = result.pass ? (result.warning ? '⚠' : '✓') : '✗';
    const color = result.pass ? (result.warning ? 'yellow' : 'green') : 'red';
    const status = result.pass ? (result.warning ? 'WARN' : 'PASS') : 'FAIL';

    log(`  ${icon} ${name}`, color);
    if (result.message) {
        console.log(`    → ${result.message}`);
    }
}

// ===== TEST IMPLEMENTATIONS =====

function testContentJsonExists() {
    try {
        if (!fs.existsSync(config.contentJsonPath)) {
            return { pass: false, message: `File not found: ${config.contentJsonPath}` };
        }
        const content = fs.readFileSync(config.contentJsonPath, 'utf8');
        contentData = JSON.parse(content);
        return { pass: true, message: `Found at: ${config.contentJsonPath}` };
    } catch (error) {
        return { pass: false, message: error.message };
    }
}

function testJsonValid() {
    if (!contentData) {
        return { pass: false, message: 'No JSON data loaded' };
    }
    try {
        JSON.stringify(contentData);
        return { pass: true, message: 'JSON is valid and parseable' };
    } catch (error) {
        return { pass: false, message: `JSON parse error: ${error.message}` };
    }
}

function testTopLevelStructure() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const keys = Object.keys(contentData);
    const hasContent = keys.length > 0;
    return {
        pass: hasContent,
        message: hasContent ? `${keys.length} top-level keys found: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}` : 'No content found'
    };
}

function testIndustriesExists() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const exists = contentData.industries && typeof contentData.industries === 'object';
    return {
        pass: exists,
        message: exists ? `Industries object found with ${Object.keys(contentData.industries).length} industries` : 'Industries object missing'
    };
}

function testRequiredIndustries() {
    if (!contentData || !contentData.industries) {
        return { pass: false, message: 'No industries data' };
    }
    const missing = config.requiredIndustries.filter(ind => !contentData.industries[ind]);
    if (missing.length > 0) {
        return { pass: false, message: `Missing required industries: ${missing.join(', ')}` };
    }
    return { pass: true, message: `All ${config.requiredIndustries.length} required industries present` };
}

function testRequiredDemos() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const missing = config.requiredDemos.filter(demo => !contentData[demo]);
    if (missing.length > 0) {
        return { pass: false, message: `Missing required demos: ${missing.join(', ')}` };
    }
    return { pass: true, message: `All ${config.requiredDemos.length} required demos present` };
}

function testIndustryFields() {
    if (!contentData || !contentData.industries) {
        return { pass: false, message: 'No industries data' };
    }
    const issues = [];
    for (const [industryName, industryData] of Object.entries(contentData.industries)) {
        for (const field of config.criticalFields.industry) {
            if (!industryData[field] || industryData[field].trim() === '') {
                issues.push(`${industryName}.${field}`);
            }
        }
    }
    if (issues.length > 0) {
        return {
            pass: false,
            message: `Missing or empty fields: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 3
        };
    }
    return { pass: true, message: 'All critical industry fields present' };
}

function testDemoFields() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const issues = [];
    for (const demoName of config.requiredDemos) {
        const demoData = contentData[demoName];
        if (demoData) {
            for (const field of config.criticalFields.demo) {
                if (!demoData[field] || demoData[field].trim() === '') {
                    issues.push(`${demoName}.${field}`);
                }
            }
        }
    }
    if (issues.length > 0) {
        return {
            pass: false,
            message: `Missing or empty fields: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 3
        };
    }
    return { pass: true, message: 'All critical demo fields present' };
}

function testUrlFormats() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const urlPattern = /^https?:\/\/.+/;
    const issues = [];

    function checkUrls(obj, path = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (key.toLowerCase().includes('url') && value && typeof value === 'string' && value !== '') {
                if (!urlPattern.test(value)) {
                    issues.push(`${path}.${key}: "${value}"`);
                }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                checkUrls(value, path ? `${path}.${key}` : key);
            }
        }
    }

    checkUrls(contentData);

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Invalid URLs found: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? ` (+${issues.length - 2} more)` : ''}`,
            warning: true
        };
    }
    return { pass: true, message: 'All URL formats are valid' };
}

function testNoEmptyFields() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const emptyFields = [];

    function checkEmpty(obj, path = '') {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            if (typeof value === 'string' && value.trim() === '') {
                emptyFields.push(currentPath);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                checkEmpty(value, currentPath);
            }
        }
    }

    checkEmpty(contentData);

    if (emptyFields.length > 0) {
        return {
            pass: false,
            message: `${emptyFields.length} empty fields found: ${emptyFields.slice(0, 3).join(', ')}${emptyFields.length > 3 ? '...' : ''}`,
            warning: true
        };
    }
    return { pass: true, message: 'No empty fields detected' };
}

function testEmojiFields() {
    if (!contentData) {
        return { pass: false, message: 'No data to test' };
    }
    const emojiPattern = /\p{Emoji}/u;
    const issues = [];

    for (const [key, value] of Object.entries(contentData)) {
        if (value && value.emoji && !emojiPattern.test(value.emoji)) {
            issues.push(`${key}.emoji: "${value.emoji}"`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Invalid emojis: ${issues.join(', ')}`,
            warning: true
        };
    }
    return { pass: true, message: 'All emoji fields valid' };
}

function testFireSafetyIntegration() {
    if (!contentData || !contentData.industries || !contentData.industries.fireSafety) {
        return { pass: false, message: 'Fire Safety data missing from industries' };
    }
    const fs = contentData.industries.fireSafety;
    const required = ['heroTitle', 'smsAgentDemoUrl', 'solution1Title'];
    const missing = required.filter(field => !fs[field] || fs[field].trim() === '');

    if (missing.length > 0) {
        return { pass: false, message: `Missing required fields: ${missing.join(', ')}` };
    }
    return { pass: true, message: 'Fire Safety integration data complete' };
}

function testGymsIntegration() {
    if (!contentData || !contentData.industries || !contentData.industries.gyms) {
        return { pass: false, message: 'Gyms data missing from industries' };
    }
    const gyms = contentData.industries.gyms;
    const required = ['heroTitle', 'smsAgentDemoUrl', 'solution1Title'];
    const missing = required.filter(field => !gyms[field] || gyms[field].trim() === '');

    if (missing.length > 0) {
        return { pass: false, message: `Missing required fields: ${missing.join(', ')}` };
    }
    return { pass: true, message: 'Gyms integration data complete' };
}

function testFileStructure() {
    const requiredFiles = [
        './content/content.json',
        './industries/fireSafety.html',
        './content-editor.html'
    ];

    const missing = requiredFiles.filter(file => !fs.existsSync(file));

    if (missing.length > 0) {
        return {
            pass: false,
            message: `Missing files: ${missing.join(', ')}`,
            warning: true
        };
    }
    return { pass: true, message: 'All required files present' };
}

// ===== TEST CATEGORIES =====

const testCategories = [
    {
        name: 'JSON Structure Tests',
        quick: true,
        tests: [
            { name: 'content.json exists and is accessible', fn: testContentJsonExists },
            { name: 'JSON is valid and parseable', fn: testJsonValid },
            { name: 'Required top-level structure exists', fn: testTopLevelStructure },
            { name: 'Industries object exists', fn: testIndustriesExists },
            { name: 'Required industries are present', fn: testRequiredIndustries },
            { name: 'Required demos are present', fn: testRequiredDemos }
        ]
    },
    {
        name: 'Data Integrity Tests',
        quick: true,
        tests: [
            { name: 'All industry pages have required fields', fn: testIndustryFields },
            { name: 'All demo pages have required fields', fn: testDemoFields },
            { name: 'All URLs are valid format', fn: testUrlFormats },
            { name: 'No empty critical fields', fn: testNoEmptyFields },
            { name: 'Emoji fields contain valid emojis', fn: testEmojiFields }
        ]
    },
    {
        name: 'Integration Tests',
        quick: true,
        tests: [
            { name: 'Fire Safety page has complete data', fn: testFireSafetyIntegration },
            { name: 'Gyms page has complete data', fn: testGymsIntegration }
        ]
    },
    {
        name: 'File Structure Tests',
        quick: true,
        tests: [
            { name: 'Required project files exist', fn: testFileStructure }
        ]
    }
];

// ===== TEST RUNNER =====

function runTests(quickOnly = false) {
    printHeader();

    const categoriesToRun = quickOnly
        ? testCategories.filter(cat => cat.quick)
        : testCategories;

    for (const category of categoriesToRun) {
        printCategoryHeader(category.name);

        const categoryResults = {
            name: category.name,
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };

        for (const test of category.tests) {
            testResults.total++;
            const result = test.fn();

            printTestResult(test.name, result);

            if (!result.pass) {
                if (result.warning) {
                    testResults.warnings++;
                    categoryResults.warnings++;
                } else {
                    testResults.failed++;
                    categoryResults.failed++;
                }
            } else {
                if (result.warning) {
                    testResults.warnings++;
                    categoryResults.warnings++;
                } else {
                    testResults.passed++;
                    categoryResults.passed++;
                }
            }

            categoryResults.tests.push({ name: test.name, ...result });
        }

        testResults.categories.push(categoryResults);
    }

    const exitCode = printSummary();
    return exitCode;
}

// ===== MAIN =====

const args = process.argv.slice(2);
const quickOnly = args.includes('--quick');

if (quickOnly) {
    log('Running quick tests only...', 'yellow');
}

const exitCode = runTests(quickOnly);
process.exit(exitCode);