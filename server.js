if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8085;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

