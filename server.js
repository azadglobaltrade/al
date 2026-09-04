const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const inquiriesFilePath = path.join(dataDir, 'inquiries.json');
if (!fs.existsSync(inquiriesFilePath)) {
  fs.writeFileSync(inquiriesFilePath, JSON.stringify([], null, 2), 'utf-8');
}

// -------------------------------------------------------------
// Middleware Setup
// -------------------------------------------------------------
app.use(compression());
app.use(cors());

// Configure Helmet with relaxed Content-Security-Policy for CDNs (Tailwind, Three.js, Lucide, Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "http:"
        ],
        mediaSrc: [
          "'self'",
          "data:",
          "blob:"
        ],
        connectSrc: [
          "'self'",
          "https:",
          "http:",
          "ws:",
          "wss:"
        ]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    service: 'Azad Global Trade API Engine v2.0'
  });
});

// Live Stats Endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    countriesServed: 3,
    clientRetention: 98,
    sampleDispatchHours: 72,
    rfqResponseTimeMinutes: 12,
    isoCertified: true,
    apedaRegistered: true,
    fieoRegistered: true,
    activePorts: ['Kolkata (Syama Prasad Mookerjee Port)', 'Haldia Dock Complex', 'Nhava Sheva (JNPT)'],
    liveDeskStatus: 'Operational · Accepting Export Orders'
  });
});

// Inquiry / RFQ Submission Endpoint
app.post('/api/inquiry', (req, res) => {
  try {
    const { name, email, phone, company, country, productCategory, message, quantity, incoterm } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Full Name and Email Address are required.'
      });
    }

    const timestamp = new Date().toISOString();
    const trackingId = `AGT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInquiry = {
      trackingId,
      timestamp,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : 'Not provided',
      company: company ? company.trim() : 'Individual / Merchant',
      country: country ? country.trim() : 'International',
      productCategory: productCategory || 'General Export Inquiry',
      quantity: quantity || 'Standard MOQ',
      incoterm: incoterm || 'FOB',
      message: message ? message.trim() : 'Quotation requested via website.',
      status: 'RECEIVED_PENDING_REVIEW'
    };

    // Read and save to JSON storage
    let currentInquiries = [];
    try {
      const data = fs.readFileSync(inquiriesFilePath, 'utf-8');
      currentInquiries = JSON.parse(data || '[]');
    } catch (e) {
      currentInquiries = [];
    }

    currentInquiries.unshift(newInquiry);
    fs.writeFileSync(inquiriesFilePath, JSON.stringify(currentInquiries, null, 2), 'utf-8');

    console.log(`[API] New Inquiry Registered: ${trackingId} from ${newInquiry.name} (${newInquiry.email})`);

    return res.status(201).json({
      success: true,
      trackingId,
      message: 'Your export quotation inquiry has been registered with our international trade desk.',
      details: {
        registeredTo: newInquiry.name,
        email: newInquiry.email,
        expectedResponseTime: 'Within 12 business minutes via WhatsApp or Email'
      }
    });
  } catch (error) {
    console.error('[API Error] /api/inquiry:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your trade inquiry.'
    });
  }
});

// Interactive 3D Container & Freight Capacity Calculator Endpoint
app.post('/api/calculate-freight', (req, res) => {
  try {
    const { productType, quantity, containerType, destinationPort } = req.body;
    
    // Product dimension & packaging specifications (CBM per unit and kg per unit)
    const productSpecs = {
      'jute_shopping_bags': { name: 'Jute Shopping Bags (320-380 GSM)', cbmPer1k: 0.85, kgPer1k: 220, defaultPalletUnits: 2500 },
      'hessian_sacks': { name: 'Hessian & Sacking Bags (Heavy Duty)', cbmPer1k: 1.45, kgPer1k: 450, defaultPalletUnits: 1500 },
      'drawstring_pouches': { name: 'Jute Drawstring Pouches', cbmPer1k: 0.35, kgPer1k: 85, defaultPalletUnits: 5000 },
      'spices_pulses': { name: 'Spices & Whole Pulses (25kg PP Bags)', cbmPer1k: 1.6, kgPer1k: 1000, defaultPalletUnits: 1000 },
      'agricultural_grain': { name: 'Export Grade Rice / Grain (50kg Sacks)', cbmPer1k: 1.7, kgPer1k: 1000, defaultPalletUnits: 1000 }
    };

    const ports = {
      'london': { name: 'Port of London / Felixstowe (UK)', transitDays: '18 - 22 days', route: 'Kolkata -> Suez -> UK Gateway' },
      'rotterdam': { name: 'Port of Rotterdam (EU Hub)', transitDays: '19 - 24 days', route: 'Kolkata -> Suez -> Rotterdam' },
      'jebel_ali': { name: 'Jebel Ali Port, Dubai (UAE)', transitDays: '7 - 10 days', route: 'Kolkata / JNPT -> Persian Gulf' },
      'hamburg': { name: 'Port of Hamburg (Germany)', transitDays: '21 - 26 days', route: 'Kolkata -> North Sea Gateway' },
      'new_york': { name: 'Port of New York & New Jersey (USA)', transitDays: '28 - 34 days', route: 'Kolkata -> Atlantic Express' },
      'singapore': { name: 'Port of Singapore (SE Asia Hub)', transitDays: '5 - 8 days', route: 'Kolkata -> Bay of Bengal Direct' }
    };

    const selectedProduct = productSpecs[productType] || productSpecs['jute_shopping_bags'];
    const selectedPort = ports[destinationPort] || ports['london'];
    const qty = Math.max(1000, parseInt(quantity, 10) || 10000);

    // Container specs:
    // 20ft Standard: Max CBM ~ 33.2 m³, Max Payload ~ 21,700 kg
    // 40ft High Cube: Max CBM ~ 76.2 m³, Max Payload ~ 26,500 kg
    const is40ft = containerType === '40ft_hc';
    const containerMaxCbm = is40ft ? 76.2 : 33.2;
    const containerMaxKg = is40ft ? 26500 : 21700;

    const totalCbm = parseFloat(((qty / 1000) * selectedProduct.cbmPer1k).toFixed(2));
    const totalWeightKg = Math.round((qty / 1000) * selectedProduct.kgPer1k);
    const totalWeightMt = parseFloat((totalWeightKg / 1000).toFixed(2));

    const volumeFillPercent = Math.min(100, parseFloat(((totalCbm / containerMaxCbm) * 100).toFixed(1)));
    const weightFillPercent = Math.min(100, parseFloat(((totalWeightKg / containerMaxKg) * 100).toFixed(1)));
    const palletsNeeded = Math.ceil(qty / selectedProduct.defaultPalletUnits);

    const recommendedContainer = totalCbm > 33.2 || totalWeightKg > 21700 ? '40ft High Cube (FCL)' : '20ft Standard (FCL)';
    const isLcl = totalCbm < 12;

    res.json({
      success: true,
      calculation: {
        productName: selectedProduct.name,
        quantity: qty,
        containerType: is40ft ? '40ft High Cube Container' : '20ft Standard Dry Container',
        totalCbm,
        totalWeightKg,
        totalWeightMt,
        volumeUtilization: `${volumeFillPercent}%`,
        weightUtilization: `${weightFillPercent}%`,
        palletsEstimate: palletsNeeded,
        freightMode: isLcl ? 'LCL (Less than Container Load) or Shared 20ft' : 'FCL (Full Container Load)',
        recommendedContainer,
        destinationPort: selectedPort.name,
        estimatedTransitTime: selectedPort.transitDays,
        shippingRoute: selectedPort.route,
        originPort: 'Kolkata Port (INCCU1) / Haldia Port (INHAL1), India'
      }
    });
  } catch (error) {
    console.error('[API Error] /api/calculate-freight:', error);
    res.status(500).json({ success: false, error: 'Freight calculation could not be completed.' });
  }
});

// Catalogue PDF download route with telemetry
app.get('/api/catalogue/download', (req, res) => {
  const cataloguePath = path.join(__dirname, 'assets', 'catalogue.pdf');
  if (fs.existsSync(cataloguePath)) {
    console.log('[API] Catalogue downloaded at', new Date().toISOString());
    res.download(cataloguePath, 'Azad_Global_Trade_Catalogue_2026.pdf');
  } else {
    res.status(404).send('Catalogue PDF currently unavailable.');
  }
});

// -------------------------------------------------------------
// Static Files Serving
// -------------------------------------------------------------
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/blog', express.static(path.join(__dirname, 'blog')));

// Direct HTML routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/jutebags.html', (req, res) => res.sendFile(path.join(__dirname, 'jutebags.html')));
app.get('/product.html', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/export.html', (req, res) => res.sendFile(path.join(__dirname, 'export.html')));
app.get('/documents.html', (req, res) => res.sendFile(path.join(__dirname, 'documents.html')));
app.get('/blog.html', (req, res) => res.sendFile(path.join(__dirname, 'blog.html')));
app.get('/terms.html', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/privacy.html', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/llms.txt', (req, res) => res.sendFile(path.join(__dirname, 'llms.txt')));

// Fallback static serve for other assets
app.use(express.static(__dirname));

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AZAD GLOBAL TRADE — NODE.JS SERVER ACTIVE`);
  console.log(`🌐 Local Server: http://localhost:${PORT}`);
  console.log(`📦 Node Version: ${process.version}`);
  console.log(`⚡ Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log(`=======================================================`);
});
