const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use('/public/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve static client assets (playground UI)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const authRoutes = require('../src/routes/auth');
const stockRoutes = require('../src/routes/stock');
const promoRoutes = require('../src/routes/promo');
const analyticsRoutes = require('../src/routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fresh Ledger Backend API is running successfully'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Run server locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[Fresh Ledger API] Server listening on port ${PORT}`);
  });
}

module.exports = app;
