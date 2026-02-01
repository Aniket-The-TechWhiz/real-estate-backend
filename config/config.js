require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate',
  
  // File upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  maxFileCount: parseInt(process.env.MAX_FILE_COUNT) || 10,
  
  // CORS configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Google Sheets configuration
  googleSheetsUrl: process.env.GOOGLE_SHEETS_URL || '',
  
  // Upload directory
  uploadDir: 'uploads/properties'
};

module.exports = config;
