/**
 * Smoke tests for Kora Contacts Hub Backend
 * 
 * Usage:
 * 1. Ensure server is running on http://localhost:3000
 * 2. (Optional) Set OKTA_TOKEN if using Okta authentication
 * 3. Run: node test-smoke.js
 * 
 * Note: If Okta is not configured, the server runs in dev mode
 * and doesn't require authentication tokens.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OKTA_TOKEN = process.env.OKTA_TOKEN;

const headers = {
  'Content-Type': 'application/json',
};

// Add Authorization header only if token is provided
if (OKTA_TOKEN) {
  headers.Authorization = `Bearer ${OKTA_TOKEN}`;
} else {
  console.log('ℹ️  Running tests without Okta token (dev mode)');
}

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

async function request(method, path, body = null) {
  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

async function runTests() {
  console.log('🧪 Running smoke tests...\n');

  // Health check (no auth)
  await test('Health check', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error('Health check failed');
    }
  });

  // Dashboard
  await test('Get dashboard', async () => {
    await request('GET', '/api/dashboard');
  });

  // Contacts
  let contactId;
  await test('Create contact', async () => {
    const contact = await request('POST', '/api/contacts', {
      name: 'Test User',
      email: 'test.user@korapay.com',
      phone: '+1234567890',
      company: 'Test Company',
    });
    contactId = contact._id;
  });

  await test('Get all contacts', async () => {
    await request('GET', '/api/contacts');
  });

  await test('Get contact by ID', async () => {
    await request('GET', `/api/contacts/${contactId}`);
  });

  await test('Update contact', async () => {
    await request('PUT', `/api/contacts/${contactId}`, {
      name: 'Test User Updated',
      email: 'test.user@korapay.com',
      phone: '+1234567890',
    });
  });

  // Devices
  let deviceId;
  await test('Create device', async () => {
    const device = await request('POST', '/api/devices', {
      name: 'Test Device',
      serialNumber: 'TEST123456',
      model: 'Test Model',
      status: 'available',
    });
    deviceId = device._id;
  });

  await test('Get all devices', async () => {
    await request('GET', '/api/devices');
  });

  await test('Get device by ID', async () => {
    await request('GET', `/api/devices/${deviceId}`);
  });

  await test('Update device', async () => {
    await request('PUT', `/api/devices/${deviceId}`, {
      name: 'Test Device Updated',
      serialNumber: 'TEST123456',
      status: 'assigned',
    });
  });

  // Cleanup
  await test('Delete contact', async () => {
    await request('DELETE', `/api/contacts/${contactId}`);
  });

  await test('Delete device', async () => {
    await request('DELETE', `/api/devices/${deviceId}`);
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

