import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './server/db';
import authRoutes from './server/routes/auth';
import admissionsRoutes from './server/routes/admissions';
import inventoryRoutes from './server/routes/inventory';
import staffRoutes from './server/routes/staff';
import settingsRoutes from './server/routes/settings';
import contactRoutes from './server/routes/contact';
import auditRoutes from './server/routes/audit';
import notificationsRoutes from './server/routes/notifications';
import reportsRoutes from './server/routes/reports';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerPort(): number {
  const portFlagIndex = process.argv.indexOf('--port');
  if (portFlagIndex !== -1 && process.argv[portFlagIndex + 1]) {
    const cliPort = parseInt(process.argv[portFlagIndex + 1], 10);
    if (!isNaN(cliPort)) return cliPort;
  }
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  if (process.env.NODE_ENV === 'production' && !isNaN(envPort)) {
    return envPort;
  }
  if (!isNaN(envPort) && envPort !== 8080) {
    return envPort;
  }
  return 3000;
}

const app = express();
const PORT = resolveServerPort();

// Initialize Database & Tables
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    institution: 'Institut Baptiste de Buberuka (IBB)',
    location: 'Rwanda',
    timezone: 'Africa/Kigali',
    time: new Date().toISOString(),
  });
});

// Ensure unknown API routes always return JSON 404 rather than SPA HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IBB School Management System] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
