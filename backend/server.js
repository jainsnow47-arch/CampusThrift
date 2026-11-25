const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { initDatabase, getDb } = require('./config/db');
const { seedData } = require('./database/seed');

const listingRoutes = require('./routes/listingRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const wantedRoutes = require('./routes/wantedRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 AS connected').get();
    res.json({
      status: 'UP',
      platform: 'ReLoop Campus Resale Marketplace',
      database: result && result.connected === 1 ? 'Connected (SQLite)' : 'Unknown',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/wanted', wantedRoutes);

// Fallback route for SPA / Direct browser navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  return res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Database initialization and server bootstrap
async function startServer() {
  try {
    console.log('[Server] Initializing SQLite database...');
    const db = initDatabase();

    // Automatically populate exactly 200 historical transactions (and prevent duplicates on restart)
    seedData(db);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('=======================================================');
      console.log('  RELOOP - THE SMART CAMPUS RESALE MARKETPLACE');
      console.log(`  Server running live at: http://localhost:${PORT}`);
      console.log(`  Marketplace UI:        http://localhost:${PORT}`);
      console.log(`  Pricing Engine API:    http://localhost:${PORT}/api/pricing`);
      console.log(`  Listings API:          http://localhost:${PORT}/api/listings`);
      console.log(`  Wanted Board API:      http://localhost:${PORT}/api/wanted`);
      console.log('=======================================================');
    });

    return server;
  } catch (err) {
    console.error('[Server] Failed to initialize application:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
