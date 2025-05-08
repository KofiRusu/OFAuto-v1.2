#!/usr/bin/env node

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const STORYBOOK_URL = 'http://localhost:6006';
const RESULTS_DIR = './a11y-results';

// Create results directory if it doesn't exist
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Log function
function log(message, isError = false) {
  console[isError ? 'error' : 'log'](message);
}

// Get all stories from Storybook
async function getStories(page) {
  log('🔍 Getting list of stories...');
  
  // Navigate to Storybook
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=introduction--page`, { waitUntil: 'networkidle0' });
  
  // Allow time for Storybook to initialize
  await page.waitForTimeout(2000);
  
  // Get all stories from Storybook
  const stories = await page.evaluate(() => {
    // @ts-ignore
    return Object.keys(window.__STORYBOOK_STORY_STORE__.getStoriesForManager())
      .filter(id => !id.includes('introduction')); // Filter out introduction pages
  });
  
  log(`📚 Found ${stories.length} stories`);
  return stories;
}

// Run accessibility tests
async function runTests() {
  let browser;
  let totalViolations = 0;
  let totalPasses = 0;
  const summary = [];
  
  try {
    log('🚀 Starting accessibility tests...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Get all stories
    const stories = await getStories(page);
    
    // Test each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${story}`;
      
      log(`🧪 Testing: ${story} (${i + 1}/${stories.length})`);
      
      try {
        await page.goto(storyUrl, { waitUntil: 'networkidle0' });
        
        // Give extra time for animations to complete
        await page.waitForTimeout(1000);
        
        // Run axe on the page
        const results = await new AxePuppeteer(page).analyze();
        
        // Extract violations and passes
        const violations = results.violations;
        totalViolations += violations.length;
        totalPasses += results.passes.length;
        
        // Generate report
        const report = {
          story,
          url: storyUrl,
          violations: violations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.map(node => ({
              html: node.html,
              failureSummary: node.failureSummary,
            })),
          })),
          timestamp: new Date().toISOString(),
        };
        
        // Add to summary
        summary.push({
          story,
          violationCount: violations.length,
          passCount: results.passes.length,
        });
        
        // Save report to file
        const fileName = story.replace(/\//g, '-').replace(/\s+/g, '_');
        fs.writeFileSync(
          path.join(RESULTS_DIR, `${fileName}.json`), 
          JSON.stringify(report, null, 2)
        );
        
        if (violations.length > 0) {
          log(`⚠️ Found ${violations.length} accessibility violations`, true);
        } else {
          log('✅ No accessibility violations found');
        }
      } catch (error) {
        log(`❌ Error testing ${story}: ${error.message}`, true);
      }
    }
    
    // Generate summary report
    const summaryReport = {
      totalStories: stories.length,
      totalViolations,
      totalPasses,
      storySummaries: summary,
      timestamp: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );
    
    // Generate HTML report
    generateHtmlReport(summaryReport, summary);
    
    log('📝 Summary:');
    log(`   - Total stories tested: ${stories.length}`);
    log(`   - Total accessibility violations: ${totalViolations}`);
    log(`   - Total accessibility passes: ${totalPasses}`);
    
    if (totalViolations > 0) {
      log(`⚠️ Accessibility tests completed with ${totalViolations} violations`, true);
      process.exit(1);
    } else {
      log('✅ All accessibility tests passed!');
      process.exit(0);
    }
  } catch (error) {
    log(`❌ Error running tests: ${error.message}`, true);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Generate HTML report
function generateHtmlReport(summaryReport, storySummaries) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 1rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .summary {
      background-color: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .summary-item {
      background-color: white;
      padding: 1rem;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .number {
      font-size: 2rem;
      font-weight: bold;
    }
    .pass {
      color: #10B981;
    }
    .fail {
      color: #EF4444;
    }
    .warning {
      color: #F59E0B;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eaeaea;
    }
    th {
      background-color: #f9f9f9;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-pass {
      background-color: #D1FAE5;
      color: #047857;
    }
    .badge-fail {
      background-color: #FEE2E2;
      color: #B91C1C;
    }
    .badge-warning {
      background-color: #FEF3C7;
      color: #92400E;
    }
    .timestamp {
      color: #6B7280;
      font-size: 0.875rem;
    }
    a {
      color: #2563EB;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <h1>Accessibility Test Report</h1>
    <p class="timestamp">Generated on ${new Date(summaryReport.timestamp).toLocaleString()}</p>
  </header>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="number">${summaryReport.totalStories}</div>
        <div>Stories Tested</div>
      </div>
      <div class="summary-item">
        <div class="number ${summaryReport.totalViolations > 0 ? 'fail' : 'pass'}">${summaryReport.totalViolations}</div>
        <div>Total Violations</div>
      </div>
      <div class="summary-item">
        <div class="number pass">${summaryReport.totalPasses}</div>
        <div>Total Passes</div>
      </div>
    </div>
  </div>
  
  <h2>Story Results</h2>
  <table>
    <thead>
      <tr>
        <th>Story</th>
        <th>Status</th>
        <th>Violations</th>
        <th>Passes</th>
        <th>Report</th>
      </tr>
    </thead>
    <tbody>
      ${storySummaries.map(story => `
        <tr>
          <td>${story.story}</td>
          <td>
            <span class="badge ${story.violationCount > 0 ? 'badge-fail' : 'badge-pass'}">
              ${story.violationCount > 0 ? 'Failed' : 'Passed'}
            </span>
          </td>
          <td>${story.violationCount}</td>
          <td>${story.passCount}</td>
          <td>
            <a href="${story.story.replace(/\//g, '-').replace(/\s+/g, '_')}.json" target="_blank">View Details</a>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
  
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'report.html'),
    html
  );
}

// Run the tests
runTests(); 