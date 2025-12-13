// Load environment variables FIRST
// Load .env.production if NODE_ENV is production, otherwise load .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8085;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env file');
  console.error('Please create a .env file from .env.example and add your MongoDB connection string');
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.error('Check your MONGODB_URI in .env file');
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

