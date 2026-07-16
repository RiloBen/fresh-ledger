const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 5005;
const BASE_URL = `http://localhost:${PORT}`;

console.log(`==================================================`);
console.log(`   FRESH LEDGER API LOCAL TEST RUNNER`);
console.log(`==================================================`);
console.log(`Targeting Server: ${BASE_URL}`);
console.log(`Make sure your server is running (npm run dev) and`);
console.log(`database is seeded (npm run seed) before starting.`);
console.log(`==================================================`);

// Helper to make http request using node core library
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(path, BASE_URL);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${path}`));
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  let token = null;

  // Test 1: Health Check Endpoint (Public)
  try {
    console.log('\n⚡ [Test 1] GET /api/health (Health check)...');
    const res = await request('GET', '/api/health');
    console.log(`-> Status: ${res.status}`);
    console.log('-> Body:', JSON.stringify(res.body, null, 2));
    if (res.status !== 200) {
      throw new Error('Health check returned non-200 status');
    }
  } catch (err) {
    console.error('❌ Health check failed. Is your local server running?');
    console.error(`Error: ${err.message}`);
    return;
  }

  // Test 2: Auth Login (Seeded Manager Account)
  try {
    console.log('\n🔑 [Test 2] POST /api/auth/login (Logging in as manager)...');
    const res = await request('POST', '/api/auth/login', {
      username: 'manager',
      password: 'manager123'
    });
    console.log(`-> Status: ${res.status}`);
    if (res.status === 200 && res.body.token) {
      token = res.body.token;
      console.log('✅ Login Success! JWT Token acquired.');
    } else {
      console.log('❌ Login failed:', JSON.stringify(res.body, null, 2));
    }
  } catch (err) {
    console.error('❌ Login request failed:', err.message);
  }

  if (!token) {
    console.log('\n🛑 Aborting remaining tests because JWT token is missing.');
    return;
  }

  // Test 3: Get Active Stocks (JWT Protected)
  try {
    console.log('\n📦 [Test 3] GET /api/stock (Retrieve inventory list)...');
    const res = await request('GET', '/api/stock', null, token);
    console.log(`-> Status: ${res.status}`);
    if (Array.isArray(res.body)) {
      console.log(`✅ Stocks retrieved! Total items found: ${res.body.length}`);
      console.log('-> First item:', JSON.stringify(res.body[0], null, 2));
    } else {
      console.log('❌ Failed retrieving stock:', JSON.stringify(res.body, null, 2));
    }
  } catch (err) {
    console.error('❌ Stock request failed:', err.message);
  }

  // Test 4: Get Waste Index Analytics (JWT Protected, Manager Only)
  try {
    console.log('\n📊 [Test 4] GET /api/analytics/waste-index (Manager dashboard)...');
    const res = await request('GET', '/api/analytics/waste-index', null, token);
    console.log(`-> Status: ${res.status}`);
    console.log('-> Body:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.error('❌ Waste index request failed:', err.message);
  }

  // Test 5: Get Procurement Forecast (JWT Protected, triggers ML Python Vercel function / SMA fallback)
  try {
    console.log('\n🔮 [Test 5] GET /api/analytics/procurement-forecast/1 (Predicting beef demand)...');
    const res = await request('GET', '/api/analytics/procurement-forecast/1', null, token);
    console.log(`-> Status: ${res.status}`);
    console.log('-> Body:', JSON.stringify(res.body, null, 2));
    console.log('\n🎉 API local testing completed successfully!');
  } catch (err) {
    console.error('❌ Forecast request failed:', err.message);
  }
}

runTests();
