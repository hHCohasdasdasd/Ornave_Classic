import './loadEnv';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import moduleRoutes from './routes/moduleRoutes';
import pageRoutes from './routes/pageRoutes';
import connectionRoutes from './routes/connectionRoutes';
import transactionRoutes from './routes/transactionRoutes';
import messageRoutes from './routes/messageRoutes';
import networkRoutes from './routes/networkRoutes';
import globalRoutes from './routes/globalRoutes';
import postRoutes from './routes/postRoutes';
import storeRoutes from './routes/storeRoutes';
import userRoutes from './routes/userRoutes';
import groupRoutes from './routes/groupRoutes';
import publicationRoutes from './routes/publicationRoutes';
import jobRoutes from './routes/jobRoutes';
import eventRoutes from './routes/eventRoutes';
import billingRoutes from './routes/billingRoutes';
import workSuiteRoutes from './routes/workSuiteRoutes';
import salesRoutes from './routes/salesRoutes';
import leadsRoutes from './routes/leadsRoutes';
import marketingRoutes from './routes/marketingRoutes';
import learningRoutes from './routes/learningRoutes';
import talentRoutes from './routes/talentRoutes';
import companyBillingRoutes from './routes/companyBillingRoutes';
import jobsFeedRoutes from './routes/jobsFeedRoutes';
import adminRoutes from './routes/adminRoutes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security and CORS middleware
const rawOrigins = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawOrigins.split(',').map(o => o.replace(/["']/g, '').trim()).filter(Boolean);

console.log(`[STARTUP] Configuring CORS with origins: ${allowedOrigins.join(', ')}`);

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Debug middleware to log ALL incoming requests
app.use((req, _res, next) => {
  console.log(`[DEBUG] ${new Date().toISOString()} | Method: ${req.method} | Path: ${req.path} | Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ============================================
// LOGGING MIDDLEWARE
// ============================================

app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// API ROUTES
// ============================================

/**
 * Mount route modules
 * Organized by business domain:
 * - /api/auth - Authentication and user management
 * - /api/companies - Company management and multi-tenancy
 * - /api/companies/:companyId/modules - Dynamic ERP modules
 * - /api/companies/:companyId/pages - Dynamic page builder
 * - /api/companies/:companyId/connections - B2B connections
 * - /api/companies/:companyId/transactions - ERP-to-ERP transactions
 * - /api/companies/:companyId/messages - Company messaging
 */

const API_BASE = '/api';

// CSRF protection for cookie-authenticated mutating requests (see
// middleware/csrf.ts) — applies across all /api routes, ahead of the
// individual route mounts below.
app.use(API_BASE, csrfProtection);

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/companies`, companyRoutes);
app.use(`${API_BASE}/companies/:companyId/modules`, moduleRoutes);
app.use(`${API_BASE}/companies/:companyId/jobs`, jobRoutes);
app.use(`${API_BASE}/companies/:companyId/pages`, pageRoutes);
app.use(`${API_BASE}/companies`, connectionRoutes);
app.use(`${API_BASE}/companies`, transactionRoutes);
app.use(`${API_BASE}/companies`, messageRoutes);
app.use(`${API_BASE}/network`, networkRoutes);
app.use(`${API_BASE}/global`, globalRoutes);
app.use(`${API_BASE}/posts`, postRoutes);
app.use(`${API_BASE}/store`, storeRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/groups`, groupRoutes);
app.use(`${API_BASE}/publications`, publicationRoutes);
app.use(`${API_BASE}/events`, eventRoutes);
app.use(`${API_BASE}/billing`, billingRoutes);
app.use(`${API_BASE}/work-suite`, workSuiteRoutes);
app.use(`${API_BASE}/companies/:companyId/deals`, salesRoutes);
app.use(`${API_BASE}/companies/:companyId/leads`, leadsRoutes);
app.use(`${API_BASE}/companies/:companyId/campaigns`, marketingRoutes);
app.use(`${API_BASE}/companies/:companyId/courses`, learningRoutes);
app.use(`${API_BASE}/companies/:companyId/candidates`, talentRoutes);
app.use(`${API_BASE}/companies/:companyId/invoices`, companyBillingRoutes);
app.use(`${API_BASE}/jobs`, jobsFeedRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(errorHandler);

export async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    app.listen(Number(PORT), () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║     ORNAVE - Global Business Network Platform             ║
║     Backend Server Started Successfully                    ║
╚════════════════════════════════════════════════════════════╝

📡 Server running on: http://localhost:${PORT}
🏥 Health check: http://localhost:${PORT}/health

🔑 Authentication: ${API_BASE}/auth
🏢 Companies: ${API_BASE}/companies
📦 Modules: ${API_BASE}/companies/:companyId/modules
📄 Pages: ${API_BASE}/companies/:companyId/pages
🔗 Connections: ${API_BASE}/companies/:companyId/connections
💼 Transactions: ${API_BASE}/companies/:companyId/transactions
💬 Messages: ${API_BASE}/companies/:companyId/messages

Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}
      `);
      resolve();
    }).on('error', (error) => {
      console.error('[STARTUP] Server error:', error);
      reject(error);
    });
  });
}

// Start server if this is the main module
// Note: In ES modules, we check if this file is being run directly
const entryPath = process.argv[1] || '';
const isMain = 
  entryPath.endsWith('index.ts') || 
  entryPath.endsWith('index.js') || 
  entryPath.endsWith('tsx') ||
  process.env.NODE_ENV === 'development'; // Always start in dev mode if unsure

console.log(`[STARTUP] Entry point: ${entryPath}, isMain: ${isMain}, Env: ${process.env.NODE_ENV}`);

if (isMain) {
  console.log(`[STARTUP] Starting server on port ${PORT}...`);
  startServer().catch((error) => {
    console.error('[STARTUP] Failed to start server:', error);
    process.exit(1);
  });
}
