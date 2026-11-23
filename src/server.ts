import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { clinicsRouter } from './api/clinics.js';
import { appointmentsRouter } from './api/appointments.js';
import { webhooksRouter } from './api/webhooks.js';
import { clinicEventService } from './services/events.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 7577;
const HOST = process.env.HOST || '0.0.0.0';

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static brochures and public assets
app.use('/brochures', express.static(path.join(process.cwd(), 'public', 'brochures')));

// Helper to resolve dashboard html file
function getDashboardHtmlPath(): string | null {
  const possiblePaths = [
    path.join(__dirname, 'ui', 'dashboard.html'),
    path.join(__dirname, '..', 'src', 'ui', 'dashboard.html'),
    path.join(process.cwd(), 'src', 'ui', 'dashboard.html'),
    path.join(process.cwd(), 'dist', 'ui', 'dashboard.html'),
  ];
  return possiblePaths.find((p) => fs.existsSync(p)) || null;
}

// 1. Live OPD Queue Flowboard (Root & Clinic Slug URLs)
app.get(['/', '/dashboard', '/:slug'], (req: Request, res: Response, next) => {
  // Pass through if request is targeting an API or static file
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  const dashboardPath = getDashboardHtmlPath();
  if (dashboardPath) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Dashboard UI file not found');
  }
});

// 2. Health & Status Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'talkar-clinic-emr',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// 3. Server-Sent Events (SSE) Stream for Live Doctor OPD Queue
app.get('/api/events/appointments', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const clinicSlug = req.query.clinic ? String(req.query.clinic) : undefined;

  clinicEventService.addClient(clientId, res, clinicSlug);

  // Initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'connected', clinicSlug })}\n\n`);

  req.on('close', () => {
    clinicEventService.removeClient(clientId);
  });
});

// 4. API Endpoints
app.use('/api/clinics/:slug/appointments', appointmentsRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/webhooks', webhooksRouter);

const DOMAIN = process.env.DOMAIN || 'clinic.talkar.in';
const baseUrl = process.env.NODE_ENV === 'production' || DOMAIN ? `https://${DOMAIN}` : `http://localhost:${PORT}`;

// Start server
app.listen(PORT, HOST, () => {
  console.log(`\n🏥 ========================================================`);
  console.log(`🩺 Talkar Clinic EMR & Doctor OPD Queue Hub is running!`);
  console.log(`🌐 Live Dashboard:  http://localhost:${PORT} / ${baseUrl}`);
  console.log(`📡 Clinics API:     http://localhost:${PORT}/api/clinics`);
  console.log(`⚡ SSE Live Stream:  http://localhost:${PORT}/api/events/appointments`);
  console.log(`📞 Post-Call Hook:  http://localhost:${PORT}/api/webhooks/call-completed`);
  console.log(`🏥 ========================================================\n`);
});
