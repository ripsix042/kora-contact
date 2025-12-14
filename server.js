// Load environment variables FIRST
// In production (Render), use environment variables from platform
// In development, load from .env file
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}
// In production, environment variables are set by Render, no need to load .env file

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8085;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined');
  if (process.env.NODE_ENV === 'production') {
    console.error('Please set MONGODB_URI in Render environment variables');
  } else {
    console.error('Please create a .env file from .env.example and add your MongoDB connection string');
  }
  process.exit(1);
}

// Log connection info (hide password for security)
const maskedUri = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
console.log('MongoDB URI (masked):', maskedUri);

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('Check your MONGODB_URI in Render environment variables');
      console.error('Also verify:');
      console.error('1. MongoDB Atlas Network Access allows 0.0.0.0/0 or Render IPs');
      console.error('2. Database user password is correct');
      console.error('3. Connection string includes database name: /koracontacthub');
    } else {
      console.error('Check your MONGODB_URI in .env file');
    }
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

