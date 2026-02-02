import express from 'express';
import compression from 'compression';
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimiter,
} from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import bulkUploadRoutes from './routes/bulkUploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import dropdownRoutes from './routes/dropdownRoutes.js';

const app = express();

// Trust proxy when behind Render/load balancer (needed for X-Forwarded-For and redirect URIs)
app.set('trust proxy', true);

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(requestLogger);

const healthResponse = (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
};

app.get('/', (req, res) => {
  res.redirect(302, '/health');
});

app.get(['/health', '/health.'], healthResponse);

app.get('/api', (req, res) => {
  res.json({
    message: 'Kora Contacts Hub API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      'api-v1': '/api/v1',
      auth: '/api/v1/auth',
      'okta-login': '/api/v1/auth/okta/login',
      'okta-callback': '/api/v1/auth/okta/callback',
      contacts: '/api/v1/contacts',
      devices: '/api/v1/devices',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      settings: '/api/v1/settings',
      'bulk-upload': '/api/v1/bulk-upload',
      invitations: '/api/v1/invitations',
      dropdowns: '/api/v1/dropdowns',
    },
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Kora Contacts Hub API v1',
    version: '1.0.0',
    endpoints: {
      'okta-login': '/api/v1/auth/okta/login',
      'okta-callback': '/api/v1/auth/okta/callback',
      contacts: '/api/v1/contacts',
      devices: '/api/v1/devices',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      settings: '/api/v1/settings',
      'bulk-upload': '/api/v1/bulk-upload',
      invitations: '/api/v1/invitations',
      dropdowns: '/api/v1/dropdowns',
    },
  });
});

// Auth (no Okta token required)
app.use('/api/v1/auth', authRoutes);

// API v1 (all require Okta Bearer token)
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/bulk-upload', bulkUploadRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/dropdowns', dropdownRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

app.use(errorHandler);

export default app;
