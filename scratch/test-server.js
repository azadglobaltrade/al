const http = require('http');

// Start server in child process or require directly
const serverApp = require('../server.js');

async function runTests() {
  console.log('--- Starting Azad Global Trade Automated Tests ---');

  // Wait 1.5s for server to settle
  await new Promise(r => setTimeout(r, 1500));

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://localhost:3000${path}`, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  try {
    // 1. Test Health Endpoint
    console.log('[Test 1] Checking GET /api/health...');
    const health = await request('/api/health');
    console.log('Health status:', health.statusCode, health.body);
    if (health.statusCode !== 200) throw new Error('Health check failed');

    // 2. Test Stats Endpoint
    console.log('[Test 2] Checking GET /api/stats...');
    const stats = await request('/api/stats');
    console.log('Stats status:', stats.statusCode, stats.body);
    if (stats.statusCode !== 200) throw new Error('Stats endpoint failed');

    // 3. Test 3D Freight & Container Calculator
    console.log('[Test 3] Checking POST /api/calculate-freight...');
    const freightPayload = JSON.stringify({
      productType: 'jute_shopping_bags',
      quantity: 15000,
      containerType: '20ft',
      destinationPort: 'london'
    });
    const freight = await request('/api/calculate-freight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(freightPayload) },
      body: freightPayload
    });
    console.log('Freight status:', freight.statusCode, freight.body);
    if (freight.statusCode !== 200) throw new Error('Freight calculation failed');

    // 4. Test RFQ Inquiry Submission
    console.log('[Test 4] Checking POST /api/inquiry...');
    const inquiryPayload = JSON.stringify({
      name: 'Alexander Wright',
      company: 'EcoRetail UK Ltd',
      email: 'alex.wright@ecoretail.co.uk',
      phone: '+44 7700 900077',
      country: 'United Kingdom',
      productCategory: 'Jute Bags & Eco Packaging',
      quantity: '15,000 units',
      incoterm: 'CIF',
      message: 'Looking for 350 GSM laminated jute totes for supermarket chain.'
    });
    const inquiry = await request('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(inquiryPayload) },
      body: inquiryPayload
    });
    console.log('Inquiry status:', inquiry.statusCode, inquiry.body);
    if (inquiry.statusCode !== 201) throw new Error('Inquiry creation failed');

    // 5. Test Frontend Static Serving
    console.log('[Test 5] Checking GET / (index.html)...');
    const index = await request('/');
    console.log('Index HTML status:', index.statusCode, 'Length:', index.body.length);
    if (index.statusCode !== 200 || !index.body.includes('3D FREIGHT & CONTAINER ENGINE')) {
      throw new Error('Index HTML content validation failed');
    }

    // 6. Test product.html with 3D Globe
    console.log('[Test 6] Checking GET /product.html...');
    const product = await request('/product.html');
    console.log('Product HTML status:', product.statusCode, 'Length:', product.body.length);
    if (product.statusCode !== 200 || !product.body.includes('globe3d-container')) {
      throw new Error('Product HTML 3D globe validation failed');
    }

    // 7. Test jutebags.html
    console.log('[Test 7] Checking GET /jutebags.html...');
    const jute = await request('/jutebags.html');
    console.log('Jute HTML status:', jute.statusCode, 'Length:', jute.body.length);
    if (jute.statusCode !== 200) {
      throw new Error('Jute HTML validation failed');
    }

    console.log('✅ ALL AZAD GLOBAL TRADE BACKEND & 3D TESTS PASSED PERFECTLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
