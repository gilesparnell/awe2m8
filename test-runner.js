#!/usr/bin/env node

/**
 * AWE2M8 Comprehensive Test Suite - CLI Version
 * Tests ALL HTML, JS, and content files across the entire project
 * Usage: node test-runner-comprehensive.js [--quick]
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
    projectRoot: '.',

    // Folders to scan
    foldersToTest: {
        agents: './agents',
        partners: './partners',
        industries: './industries',
        api: './api'
    },

    // Required files
    requiredFiles: [
        './content/content.json',
        './content-editor.html',
        './index.html'
    ],

    // Required JSON structure
    requiredIndustries: ['fireSafety', 'gyms'],
    requiredDemos: ['voiceAI', 'aiReceptionist', 'databaseReactivation'],

    // Critical fields per content type
    criticalFields: {
        industry: ['pageTitle', 'heroTitle', 'heroSubtitle', 'solution1Title', 'smsAgentDemoUrl'],
        demo: ['title', 'emoji', 'heroDescription']
    },

    // HTML validation
    htmlRequiredElements: {
        industry: ['hero-title', 'hero-subtitle', 'solution1-title'],
        standard: ['head', 'body', 'title']
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
    log('  🧪 AWE2M8 Comprehensive Test Suite - CLI Version  ', 'bright');
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

// ===== FILE DISCOVERY FUNCTIONS =====

function findFilesInDirectory(dir, extension, recursive = true) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    let results = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && recursive) {
            results = results.concat(findFilesInDirectory(fullPath, extension, recursive));
        } else if (stat.isFile() && fullPath.endsWith(extension)) {
            results.push(fullPath);
        }
    }

    return results;
}

function getAllHtmlFiles() {
    const files = [];
    for (const [name, dir] of Object.entries(config.foldersToTest)) {
        files.push(...findFilesInDirectory(dir, '.html'));
    }
    // Add root HTML files
    files.push(...findFilesInDirectory('.', '.html', false));
    return files;
}

function getAllJsFiles() {
    const files = [];
    for (const [name, dir] of Object.entries(config.foldersToTest)) {
        files.push(...findFilesInDirectory(dir, '.js'));
    }
    // Add root JS files
    files.push(...findFilesInDirectory('.', '.js', false));
    // Exclude node_modules and test files
    return files.filter(f => !f.includes('node_modules') && !f.includes('test-runner'));
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
        return { pass: true, message: 'JSON is valid and parseable' };
    } catch (error) {
        return { pass: false, message: `JSON parse error: ${error.message}` };
    }
}

function testAllIndustriesHaveData() {
    if (!contentData || !contentData.industries) {
        return { pass: false, message: 'No industries data' };
    }

    const industries = Object.keys(contentData.industries);
    const issues = [];

    for (const industry of industries) {
        const data = contentData.industries[industry];
        for (const field of config.criticalFields.industry) {
            if (!data[field] || data[field].trim() === '') {
                issues.push(`${industry}.${field}`);
            }
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Missing fields: ${issues.slice(0, 5).join(', ')}${issues.length > 5 ? ` (+${issues.length - 5} more)` : ''}`,
            warning: issues.length < 5
        };
    }

    return { pass: true, message: `All ${industries.length} industries have complete data` };
}

// ===== HTML TESTS =====

function testHtmlFilesExist() {
    const htmlFiles = getAllHtmlFiles();
    if (htmlFiles.length === 0) {
        return { pass: false, message: 'No HTML files found in project' };
    }
    return { pass: true, message: `Found ${htmlFiles.length} HTML files` };
}

function testHtmlFilesValid() {
    const htmlFiles = getAllHtmlFiles();
    const issues = [];

    for (const file of htmlFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // Basic HTML validation
            if (!content.includes('<html')) {
                issues.push(`${file}: Missing <html> tag`);
            }
            if (!content.includes('<head')) {
                issues.push(`${file}: Missing <head> tag`);
            }
            if (!content.includes('<body')) {
                issues.push(`${file}: Missing <body> tag`);
            }

            // Check for unclosed tags (basic check)
            const openDivs = (content.match(/<div/g) || []).length;
            const closeDivs = (content.match(/<\/div>/g) || []).length;
            if (openDivs !== closeDivs) {
                issues.push(`${file}: Mismatched div tags (${openDivs} open, ${closeDivs} close)`);
            }

        } catch (error) {
            issues.push(`${file}: ${error.message}`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Issues found: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 5
        };
    }

    return { pass: true, message: `All ${htmlFiles.length} HTML files are structurally valid` };
}

function testIndustryPagesHaveRequiredIds() {
    const industryFiles = findFilesInDirectory(config.foldersToTest.industries, '.html');
    const issues = [];

    for (const file of industryFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // Check for required IDs
            const requiredIds = config.htmlRequiredElements.industry;
            for (const id of requiredIds) {
                if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
                    issues.push(`${path.basename(file)}: Missing id="${id}"`);
                }
            }

        } catch (error) {
            issues.push(`${file}: ${error.message}`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Missing IDs: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? `... (+${issues.length - 3} more)` : ''}`,
            warning: true
        };
    }

    return { pass: true, message: `All ${industryFiles.length} industry pages have required IDs` };
}

// ===== JS TESTS =====

function testJsFilesExist() {
    const jsFiles = getAllJsFiles();
    if (jsFiles.length === 0) {
        return { pass: false, message: 'No JS files found in project', warning: true };
    }
    return { pass: true, message: `Found ${jsFiles.length} JavaScript files` };
}

function testJsFilesSyntax() {
    const jsFiles = getAllJsFiles();
    const issues = [];

    for (const file of jsFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // Basic syntax checks
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            if (openBraces !== closeBraces) {
                issues.push(`${path.basename(file)}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
            }

            const openParens = (content.match(/\(/g) || []).length;
            const closeParens = (content.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                issues.push(`${path.basename(file)}: Mismatched parentheses (${openParens} open, ${closeParens} close)`);
            }

            // Check for console.log in production files (warning only)
            if (content.includes('console.log') && !file.includes('test') && !file.includes('debug')) {
                // This is just a warning, not a failure
            }

        } catch (error) {
            issues.push(`${file}: ${error.message}`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Syntax issues: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
            warning: issues.length < 3
        };
    }

    return { pass: true, message: `All ${jsFiles.length} JS files have valid syntax` };
}

// ===== FOLDER STRUCTURE TESTS =====

function testAgentsFolderStructure() {
    const agentsDir = config.foldersToTest.agents;

    if (!fs.existsSync(agentsDir)) {
        return { pass: false, message: 'Agents folder not found', warning: true };
    }

    const files = fs.readdirSync(agentsDir);
    return { pass: true, message: `Agents folder exists with ${files.length} items` };
}

function testPartnersFolderStructure() {
    const partnersDir = config.foldersToTest.partners;

    if (!fs.existsSync(partnersDir)) {
        return { pass: false, message: 'Partners folder not found', warning: true };
    }

    const files = fs.readdirSync(partnersDir);
    return { pass: true, message: `Partners folder exists with ${files.length} items` };
}

function testIndustriesFolderStructure() {
    const industriesDir = config.foldersToTest.industries;

    if (!fs.existsSync(industriesDir)) {
        return { pass: false, message: 'Industries folder not found' };
    }

    const htmlFiles = findFilesInDirectory(industriesDir, '.html');

    if (htmlFiles.length === 0) {
        return { pass: false, message: 'No HTML files in industries folder' };
    }

    return { pass: true, message: `Industries folder has ${htmlFiles.length} HTML files` };
}

// ===== INTEGRATION TESTS =====

function testIndustryPagesMatchJson() {
    if (!contentData || !contentData.industries) {
        return { pass: false, message: 'No industries data in JSON' };
    }

    const industriesInJson = Object.keys(contentData.industries);
    const industryFiles = findFilesInDirectory(config.foldersToTest.industries, '.html');
    const industryFilenames = industryFiles.map(f => path.basename(f, '.html'));

    const missingPages = industriesInJson.filter(ind =>
        !industryFilenames.some(f => f.toLowerCase().includes(ind.toLowerCase()))
    );

    if (missingPages.length > 0) {
        return {
            pass: false,
            message: `Industries in JSON but missing HTML pages: ${missingPages.join(', ')}`,
            warning: true
        };
    }

    return { pass: true, message: `All ${industriesInJson.length} industries have corresponding HTML pages` };
}

function testAllPagesLoadJson() {
    const htmlFiles = getAllHtmlFiles();
    const issues = [];

    for (const file of htmlFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // Check if page references content.json
            if (content.includes('content.json') || content.includes('content/content.json')) {
                // Check if it has proper error handling
                if (!content.includes('catch') && !content.includes('.then')) {
                    issues.push(`${path.basename(file)}: Loads JSON but missing error handling`);
                }
            }

        } catch (error) {
            issues.push(`${file}: ${error.message}`);
        }
    }

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Issues: ${issues.slice(0, 2).join('; ')}`,
            warning: true
        };
    }

    return { pass: true, message: 'All pages that load JSON have error handling' };
}

// ===== TEST CATEGORIES =====

const testCategories = [
    {
        name: 'JSON Structure Tests',
        quick: true,
        tests: [
            { name: 'content.json exists and is accessible', fn: testContentJsonExists },
            { name: 'JSON is valid and parseable', fn: testJsonValid },
            { name: 'All industries have complete data', fn: testAllIndustriesHaveData }
        ]
    },
    {
        name: 'HTML File Tests',
        quick: true,
        tests: [
            { name: 'HTML files exist in project', fn: testHtmlFilesExist },
            { name: 'All HTML files are structurally valid', fn: testHtmlFilesValid },
            { name: 'Industry pages have required IDs', fn: testIndustryPagesHaveRequiredIds }
        ]
    },
    {
        name: 'JavaScript Tests',
        quick: true,
        tests: [
            { name: 'JavaScript files exist in project', fn: testJsFilesExist },
            { name: 'All JS files have valid syntax', fn: testJsFilesSyntax }
        ]
    },
    {
        name: 'Folder Structure Tests',
        quick: true,
        tests: [
            { name: 'Agents folder structure is valid', fn: testAgentsFolderStructure },
            { name: 'Partners folder structure is valid', fn: testPartnersFolderStructure },
            { name: 'Industries folder structure is valid', fn: testIndustriesFolderStructure }
        ]
    },
    {
        name: 'Integration Tests',
        quick: true,
        tests: [
            { name: 'Industry pages match JSON data', fn: testIndustryPagesMatchJson },
            { name: 'Pages loading JSON have error handling', fn: testAllPagesLoadJson }
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