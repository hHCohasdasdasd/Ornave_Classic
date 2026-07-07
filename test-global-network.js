#!/usr/bin/env node
/**
 * Global Business Network - Comprehensive Test Suite
 * Tests all 5 phases using REST API calls
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const NETWORK_URL = 'http://localhost:3000/api/network';

// Test counters
let tests = 0;
let passed = 0;
let failed = 0;

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

function print(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function header(text) {
  print(`\n════ ${text} ════\n`, 'yellow');
}

// Make HTTP request
function makeRequest(method, url, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test function
async function test(description, method, url, body = null, token = null) {
  tests++;
  process.stdout.write(`[Test ${tests}] ${description}... `);

  try {
    const result = await makeRequest(method, url, body, token);
    if (result.status >= 200 && result.status < 300) {
      print('✓ PASSED', 'green');
      passed++;
      return result.data;
    } else {
      const errorMsg = result.data?.message || 'Unknown error';
      print(`✗ FAILED (${result.status}): ${errorMsg}`, 'red');
      if (result.data?.error) print(`  Error: ${JSON.stringify(result.data.error)}`, 'red');
      failed++;
      return null;
    }
  } catch (error) {
    print(`✗ FAILED - ${error.message}`, 'red');
    failed++;
    return null;
  }
}

// Main test suite
async function runTests() {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const company1Email = `acme-${runId}@test.com`;
  const company2Email = `tech-${runId}@test.com`;

  print(
    `
╔════════════════════════════════════════════════════════════╗
║     GLOBAL BUSINESS NETWORK - TEST SUITE                   ║
║     Testing all 5 phases of transformation                 ║
╚════════════════════════════════════════════════════════════╝
    `,
    'magenta'
  );

  // Setup: Register companies
  header('SETUP: Register Test Companies');

  const c1 = await test('Register Company 1 (Acme Corp)', 'POST', `${BASE_URL}/auth/register`, {
    email: company1Email,
    password: 'Test123!@$',
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Acme Corp',
  });

  let token1, comp1Id;
  if (c1) {
    token1 = c1.data.token;
    comp1Id = c1.data.user.companyId;
    print(`✓ Company 1 ID: ${comp1Id}`, 'green');
    print(`✓ Token1: ${token1 ? 'present' : 'MISSING'}`, token1 ? 'green' : 'red');
  }

  const c2 = await test('Register Company 2 (TechVision Inc)', 'POST', `${BASE_URL}/auth/register`, {
    email: company2Email,
    password: 'Test123!@$',
    firstName: 'Jane',
    lastName: 'Smith',
    companyName: 'TechVision Inc',
  });

  let token2, comp2Id;
  if (c2) {
    token2 = c2.data.token;
    comp2Id = c2.data.user.companyId;
    print(`✓ Company 2 ID: ${comp2Id}`, 'green');
  }

  // Phase 1: Global Directory
  header('PHASE 1: GLOBAL DIRECTORY - Company Discovery');

  await test('Company 1: Update profile', 'POST', `${NETWORK_URL}/directory/profile`, {
    industry: 'Technology',
    country: 'USA',
    capabilities: ['Software Development', 'Cloud Services'],
    isPublicProfile: true,
    about: 'Leading software development company',
    website: 'https://acmecorp.test',
  }, token1);

  await test('Company 2: Update profile', 'POST', `${NETWORK_URL}/directory/profile`, {
    industry: 'Manufacturing',
    country: 'USA',
    capabilities: ['Industrial Automation', 'Supply Chain'],
    isPublicProfile: true,
    about: 'Advanced manufacturing solutions',
    website: 'https://techvision.test',
  }, token2);

  await test('Search directory by industry', 'GET', `${NETWORK_URL}/directory/search?industry=Technology`, null, token1);

  await test('Get directory statistics', 'GET', `${NETWORK_URL}/directory/stats`, null, token1);

  // Phase 2: Connections
  header('PHASE 2: CONNECTIONS & PERMISSIONS - Build Trust Network');

  const connReq = await test('Company 1: Send connection request', 'POST', `${NETWORK_URL}/connections/request`, {
    toCompanyId: comp2Id,
    connectionType: 'SUPPLIER',
    requestMessage: 'Partnership opportunity',
  }, token1);

  let connectionId;
  if (connReq) {
    connectionId = connReq.data.id;
    print(`✓ Connection ID: ${connectionId}`, 'green');
  }

  await test('Company 2: View connections', 'GET', `${NETWORK_URL}/connections`, null, token2);

  if (connectionId) {
    await test('Company 2: Accept connection', 'POST', `${NETWORK_URL}/connections/${connectionId}/accept`, {}, token2);

    await test('Company 2: Grant base permissions', 'POST', `${NETWORK_URL}/connections/${connectionId}/permissions`, {
      canViewInventory: true,
      canCreateOrders: true,
      canViewOrders: true,
      canCreateInvoices: true,
      canViewInvoices: true,
      canAccessPricing: false,
      canReceiveMessages: true,
    }, token2);

    await test('Company 2: Grant pricing access', 'POST', `${NETWORK_URL}/connections/${connectionId}/permissions`, {
      canAccessPricing: true,
    }, token2);
  }

  // Phase 3: Transactions
  header('PHASE 3: GLOBAL TRANSACTIONS - B2B Document Exchange');

  const txn = await test('Company 1: Create purchase order', 'POST', `${NETWORK_URL}/transactions`, {
    toCompanyId: comp2Id,
    connectionId: connectionId,
    transactionType: 'PURCHASE_ORDER',
    payload: {
      poNumber: 'PO-2026-001',
      itemCount: 5,
      totalAmount: 50000,
      dueDate: '2026-03-16',
      items: [
        {
          partNumber: 'COMP-001',
          description: 'Industrial Motor',
          quantity: 10,
          unitPrice: 5000,
        },
      ],
    },
  }, token1);

  let txnId;
  if (txn) {
    txnId = txn.data.id;
    print(`✓ Transaction ID: ${txnId}`, 'green');
  }

  if (txnId) {
    await test('Company 1: Send transaction', 'POST', `${NETWORK_URL}/transactions/${txnId}/send`, null, token1);

    await test('Company 2: Get received transactions', 'GET', `${NETWORK_URL}/transactions?direction=received`, null, token2);

    await test('Company 2: View transaction details', 'GET', `${NETWORK_URL}/transactions/${txnId}`, null, token2);

    await test('Company 2: Accept transaction', 'POST', `${NETWORK_URL}/transactions/${txnId}/accept`, {
      notes: 'Confirming receipt of order',
    }, token2);
  }

  // Phase 4: Data Mapping
  header('PHASE 4: DATA MAPPING - Format Translation');

  await test('Company 1: Define data mapping', 'POST', `${NETWORK_URL}/mappings`, {
    moduleName: 'sales',
    globalObjectType: 'GlobalInvoice',
    fieldMappings: [
      { internalField: 'invoice_id', globalField: 'invoiceNumber' },
      { internalField: 'total_amount', globalField: 'totalAmount' },
    ],
  }, token1);

  await test('Company 1: Get all mappings', 'GET', `${NETWORK_URL}/mappings`, null, token1);

  // Phase 5: Activity Stream
  header('PHASE 5: ACTIVITY STREAM - Real-time Visibility');

  await test('Company 2: Get unread count', 'GET', `${NETWORK_URL}/activity/unread-count`, null, token2);

  await test('Company 2: View activity feed', 'GET', `${NETWORK_URL}/activity/feed`, null, token2);

  await test('Company 2: Get unread activities only', 'GET', `${NETWORK_URL}/activity/feed?limit=10&offset=0&unreadOnly=true`, null, token2);

  // Results
  header('TEST RESULTS SUMMARY');

  const total = passed + failed;
  const percentage = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

  print(`Total Tests: ${total}`, 'cyan');
  print(`Passed: ${passed} ✓`, 'green');
  print(`Failed: ${failed} ✗`, 'red');
  print(`Success Rate: ${percentage}%`, 'cyan');

  if (failed === 0) {
    print(`\n✓ ALL TESTS PASSED - Global Business Network is functional!\n`, 'green');
  } else {
    print(`\n⚠ Some tests failed. Review output above.\n`, 'yellow');
  }

  print(`════════════════════════════════════════════════════════════`, 'yellow');
  print(`Test execution completed at ${new Date().toISOString()}`, 'yellow');
  print(`════════════════════════════════════════════════════════════\n`, 'yellow');
}

// Run tests
runTests().catch((error) => {
  print(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
