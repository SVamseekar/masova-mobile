/**
 * Staging / Dell Backend API Smoke Test Script
 * Verifies live gateway health, store details, menu catalog loading, and authentication endpoint reachability.
 *
 * Usage:
 *   node scripts/dell-smoke-test.js [BASE_URL]
 *   Default BASE_URL: http://192.168.50.88:8080/api
 */

const BASE_URL = process.argv[2] || process.env.API_BASE_URL || 'http://192.168.50.88:8080/api';

async function runSmokeTests() {
  console.log(`\n🚀 Starting Dell Staging Smoke Tests against: ${BASE_URL}\n`);
  let passedCount = 0;
  let failedCount = 0;

  async function checkStep(name, fn) {
    try {
      console.log(`[TEST] ${name}...`);
      await fn();
      console.log(`  ✅ PASSED: ${name}\n`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name} — ${err.message}\n`);
      failedCount++;
    }
  }

  // 1. Store Service Health & List Check
  await checkStep('1. Store Service Health Check', async () => {
    const res = await fetch(`${BASE_URL}/stores`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const stores = Array.isArray(data) ? data : (data.content || []);
    if (stores.length === 0) {
      throw new Error('No stores returned');
    }
    console.log(`     Fetched ${stores.length} store(s)`);
  });

  // 2. Store Operating Config & Delivery Zone Capabilities
  await checkStep('2. Store Details & Delivery Config Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/stores/DOM001`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log(`     Store: ${data.name} (${data.storeCode}), Delivery Radius: ${data.operatingConfig?.deliveryRadiusKm || 'N/A'}km`);
  });

  // 3. Menu Service Catalog Loading
  await checkStep('3. Menu Service Items Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/menu`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.content || []);
    if (items.length === 0) {
      throw new Error('No menu items returned');
    }
    console.log(`     Fetched ${items.length} menu item(s)`);
  });

  // 4. Customer Auth Gateway Reachability
  await checkStep('4. Auth Service Login Endpoint Reachability', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@masova.com',
        password: 'Password123!',
      }),
      signal: AbortSignal.timeout(5000),
    });
    // Endpoint is reachable if backend returns 200 (Success) or 500 ("Invalid credentials")
    const text = await res.text();
    if (res.ok || text.includes('Invalid credentials') || res.status === 401 || res.status === 400) {
      console.log(`     Auth gateway route verified (HTTP ${res.status})`);
    } else {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
  });

  console.log(`========================================`);
  console.log(`Summary: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal error during smoke test runner:', err);
  process.exit(1);
});
