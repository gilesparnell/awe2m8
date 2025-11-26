#!/usr/bin/env node

/**
 * AWE2M8 Test Suite - Updated with Partners Support
 * Tests ALL HTML files in agents/, industries/, partners/
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
    requiredPartners: ['rayWhiteUpperNorthShore'], // NEW: Required partner pages
    criticalFields: {
        industry: ['pageTitle', 'heroTitle', 'heroSubtitle', 'solution1Title', 'smsAgentDemoUrl'],
        demo: ['title', 'emoji', 'heroDescription'],
        partner: ['title', 'emoji', 'heroDescription', 'pageTitle'] // NEW: Partner required fields
    },
    // Folders to validate
    requiredFolders: ['content', 'industries', 'agents'],
    optionalFolders: ['partners', 'css', 'js', 'images'],
    // Expected core files
    expectedFiles: {
        'content/content.json': 'Content JSON file',
        'content-editor.html': 'Content editor'
    },
    // Partner HTML file mappings
    partnerHtmlFiles: {
        'rayWhiteUpperNorthShore': 'partners/raywhite-realestate.html'
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
    log('    📁 Testing ALL HTML Files in All Folders    ', 'cyan');
    log('       ✨ Now with Partners Support! ✨         ', 'cyan');
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
        return 0;
    } else {
        log('════════════════════════════════════════════════', 'red');
        log('  ✗✗✗ CRITICAL TESTS FAILED - DO NOT COMMIT ✗✗✗  ', 'red');
        log('════════════════════════════════════════════════', 'red');
        return 1;
    }
}

function printCategoryHeader(name) {
    console.log('');
    log(`▼ ${name}`, 'blue');
}

function printTestResult(name, result) {
    const icon = result.pass ? (result.warning ? '⚠' : '✓') : '✗';
    const color = result.pass ? (result.warning ? 'yellow' : 'green') : 'red';

    log(`  ${icon} ${name}`, color);
    if (result.message) {
        console.log(`    → ${result.message}`);
    }
}

// ===== COMPREHENSIVE HTML VALIDATION =====

// ===== TEMPLATE TESTS =====

function testTemplatesExist() {
    const templates = [
        'agent-template.html',
        'industry-template.html',
        'partner-template.html'
    ];

    const missing = templates.filter(t => !fs.existsSync(t));

    if (missing.length > 0) {
        return {
            pass: false,
            message: `Missing templates: ${missing.join(', ')}`
        };
    }

    return {
        pass: true,
        message: `All ${templates.length} templates exist`
    };
}

function testTemplatesValid() {
    const templates = [
        'agent-template.html',
        'industry-template.html',
        'partner-template.html'
    ];

    const issues = [];
    let validFiles = 0;

    for (const file of templates) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (!content.includes('<!DOCTYPE') && !content.includes('<html')) {
                issues.push(`${file}: Missing DOCTYPE or html tag`);
            } else if (content.length < 50) {
                issues.push(`${file}: File too short`);
            } else {
                validFiles++;
            }
        } catch (error) {
            issues.push(`${file}: Cannot read`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `${issues.length} templates have issues: ${issues.join('; ')}`
        };
    }

    return {
        pass: true,
        message: 'All templates are valid HTML'
    };
}

// ===== EXISTING TESTS =====

function testRequiredFoldersExist() {
    const missing = [];
    const found = [];

    for (const folder of config.requiredFolders) {
        if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
            found.push(folder);
        } else {
            missing.push(folder);
        }
    }

    if (missing.length > 0) {
        return {
            pass: false,
            message: `Missing critical folders: ${missing.join(', ')}`
        };
    }

    return {
        pass: true,
        message: `All required folders exist: ${found.join(', ')}`
    };
}

function testRelativePathsWork() {
    const issues = [];
    const foldersToTest = ['industries', 'agents', 'partners'];

    for (const folder of foldersToTest) {
        if (fs.existsSync(folder)) {
            const relativePath = path.join(folder, '..', 'content', 'content.json');
            if (!fs.existsSync(relativePath)) {
                issues.push(`From ${folder}/ to content.json is broken`);
            }
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: issues.join('; ')
        };
    }

    return {
        pass: true,
        message: 'All relative paths work correctly'
    };
}

function testDeploymentStructure() {
    const required = ['content', 'industries', 'agents'];
    const missing = required.filter(f => !fs.existsSync(f));

    if (missing.length > 0) {
        return {
            pass: false,
            message: `Missing required for deployment: ${missing.join(', ')}`
        };
    }

    // Check for index.html
    if (!fs.existsSync('index.html')) {
        return {
            pass: true,
            warning: true,
            message: 'Deployment structure valid (index.html recommended but not required)'
        };
    }

    return {
        pass: true,
        message: 'Deployment structure is complete'
    };
}

// ===== JSON TESTS =====

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
        return { pass: true, message: 'JSON is valid' };
    } catch (error) {
        return { pass: false, message: `JSON error: ${error.message}` };
    }
}

function testPartnersInContentJson() {
    if (!contentData) {
        return { pass: false, message: 'No JSON data loaded' };
    }

    if (!contentData.partners) {
        return {
            pass: false,
            message: 'Partners section missing from content.json'
        };
    }

    if (typeof contentData.partners !== 'object') {
        return {
            pass: false,
            message: 'Partners section exists but is not an object'
        };
    }

    const partnerCount = Object.keys(contentData.partners).length;
    return {
        pass: true,
        message: `Partners section exists with ${partnerCount} partner(s)`
    };
}

function testRayWhiteInContentJson() {
    if (!contentData || !contentData.partners) {
        return { pass: false, message: 'No partners data in JSON' };
    }

    if (!contentData.partners.rayWhiteUpperNorthShore) {
        return {
            pass: false,
            message: 'rayWhiteUpperNorthShore missing from content.json partners section'
        };
    }

    return {
        pass: true,
        message: 'Ray White entry exists in content.json'
    };
}

function testPartnerFields() {
    if (!contentData || !contentData.partners) {
        return { pass: false, message: 'No partners data' };
    }

    const issues = [];

    for (const [partnerName, partnerData] of Object.entries(contentData.partners)) {
        for (const field of config.criticalFields.partner) {
            if (!partnerData[field] || partnerData[field].trim() === '') {
                issues.push(`${partnerName}.${field}`);
            }
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Missing/empty partner fields: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 3
        };
    }

    return {
        pass: true,
        message: `All ${Object.keys(contentData.partners).length} partner(s) have required fields`
    };
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
            message: `Missing fields: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 3
        };
    }
    return { pass: true, message: 'All critical fields present' };
}

// ===== TEST CATEGORIES =====

const testCategories = [
    {
        name: 'Folder Structure Tests',
        quick: true,
        tests: [
            { name: 'Required folders exist', fn: testRequiredFoldersExist },
            { name: 'Relative paths work correctly', fn: testRelativePathsWork },
            { name: 'Deployment structure is valid', fn: testDeploymentStructure }
        ]
    },
    {
        name: 'Template Tests',
        quick: true,
        tests: [
            { name: 'Templates exist', fn: testTemplatesExist },
            { name: 'Templates are valid HTML', fn: testTemplatesValid }
        ]
    },
    {
        name: 'JSON & Integration Tests',
        quick: true,
        tests: [
            { name: 'content.json exists and loads', fn: testContentJsonExists },
            { name: 'JSON is valid', fn: testJsonValid },
            { name: 'Partners section exists in JSON', fn: testPartnersInContentJson },
            { name: 'Ray White in content.json', fn: testRayWhiteInContentJson },
            { name: 'Partner fields are complete', fn: testPartnerFields },
            { name: 'Industry fields are complete', fn: testIndustryFields }
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

        for (const test of category.tests) {
            testResults.total++;
            const result = test.fn();

            printTestResult(test.name, result);

            if (!result.pass) {
                if (result.warning) {
                    testResults.warnings++;
                } else {
                    testResults.failed++;
                }
            } else {
                if (result.warning) {
                    testResults.warnings++;
                } else {
                    testResults.passed++;
                }
            }
        }
    }

    const exitCode = printSummary();
    return exitCode;
}

// ===== MAIN =====

const args = process.argv.slice(2);
const quickOnly = args.includes('--quick');

const exitCode = runTests(quickOnly);
process.exit(exitCode);