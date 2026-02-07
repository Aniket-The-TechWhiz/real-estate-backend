const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');
const propertyRoutes = require('./routes/PropertyRoutes');
const leadRoutes = require('./routes/LeadRoutes');

// Initialize express app
const app = express();

// Middleware
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:3001',
  'https://real-estate-frontend-eight-tawny.vercel.app',
  ...config.clientUrls
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(config.mongodbUri)
  .then(() => {
    console.log('✓ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Real Estate API',
    version: '1.0.0',
    endpoints: {
      properties: '/api/properties',
      leads: '/api/leads'
    }
  });
});

app.use('/api/properties', propertyRoutes);
app.use('/api/leads', leadRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`✓ Server running on port ${config.port}`);
  console.log(`✓ Environment: ${config.nodeEnv}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('✗ Unhandled Promise Rejection:', err);
  process.exit(1);
});
