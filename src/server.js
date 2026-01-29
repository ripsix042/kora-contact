import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { corsMiddleware, helmetMiddleware, rateLimiter } from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { verifyOktaToken } from './middlewares/oktaAuth.js';

// Routes
import contactRoutes from './routes/contactRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import bulkUploadRoutes from './routes/bulkUploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import dropdownRoutes from './routes/dropdownRoutes.js';

// Workers
import { startContactSyncWorker } from './workers/contactSyncWorker.js';
import { startDeviceSyncWorker } from './workers/deviceSyncWorker.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimiter);

// Body parsing (must be before request logger to access req.body)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (after body parsing to log request data)
app.use(requestLogger);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (all require Okta authentication)
app.use('/api/contacts', contactRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/dropdowns', dropdownRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Validate encryption key (required for encrypted fields)
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }

    // Okta is optional - warn if not configured
    if (!process.env.OKTA_ISSUER || !process.env.OKTA_AUDIENCE) {
      console.warn('⚠️  Okta not configured - running in development mode');
      console.warn('   All endpoints will use mock authentication');
      console.warn('   Set OKTA_ISSUER and OKTA_AUDIENCE to enable Okta SSO');
    }

    // Connect to databases
    await connectDB();
    
    // Redis is optional - don't crash if it fails
    try {
      await connectRedis();
    } catch (error) {
      console.warn('⚠️  Redis connection failed - continuing without background jobs');
    }

    // Start background workers (only if Redis is available)
    const redisHost = process.env.REDIS_HOST?.trim();
    if (redisHost && redisHost !== 'localhost' && redisHost !== '127.0.0.1') {
      const contactWorker = startContactSyncWorker();
      const deviceWorker = startDeviceSyncWorker();
      if (contactWorker && deviceWorker) {
        console.log('Background workers started');
      }
    } else {
      console.warn('⚠️  Background workers disabled - Redis not configured');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.OKTA_ISSUER) {
        console.log(`Okta Issuer: ${process.env.OKTA_ISSUER}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

