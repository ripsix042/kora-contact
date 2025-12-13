/**
 * Test MongoDB Connection Script
 * Run: node test-mongodb-connection.js
 */

require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.production');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('Connection string (password hidden):', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('ERROR: MongoDB connection failed');
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\nPossible issues:');
      console.error('1. Password is incorrect');
      console.error('2. Password contains special characters that need URL encoding');
      console.error('3. Database user does not exist');
      console.error('\nTo URL encode password, use:');
      console.error('  encodeURIComponent("your-password")');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\nPossible issues:');
      console.error('1. Network access not configured in MongoDB Atlas');
      console.error('2. Your IP address is not whitelisted');
      console.error('3. Cluster is paused or not running');
    }
    
    process.exit(1);
  });

