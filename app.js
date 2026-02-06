
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

//API routes from src (dashboard, contacts, devices, etc.)
import contactRoutes from './src/routes/contactRoutes.js';
import deviceRoutes from './src/routes/deviceRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import bulkUploadRoutes from './src/routes/bulkUploadRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import invitationRoutes from './src/routes/invitationRoutes.js';
import dropdownRoutes from './src/routes/dropdownRoutes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import scanRoutes from './src/routes/scanRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

// Middleware
app.use(helmet());

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 60000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || 10,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Kora Contacts Hub API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      public: '/api/public',
      contacts: '/api/contacts',
      devices: '/api/devices',
      users: '/api/users',
      dashboard: '/api/dashboard',
      settings: '/api/settings',
    },
  });
});

// Mount PUBLIC routes first (no auth - for QR code / share links)
app.use('/api/public', publicRoutes);

// Mount protected API routes
app.use('/api/contacts', contactRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/dropdowns', dropdownRoutes);
app.use('/api/scans', scanRoutes);

// Error handling (use src errorHandler so AppError statusCode is respected)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Fallback error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

export default app;
