import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import gradingRoutes from './routes/gradingRoutes';
import settingsRoutes from './routes/settingsRoutes';
import gitRoutes from './routes/gitRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import classRoutes from './routes/classRoutes';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const port = process.env.PORT || process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    subsystem: 'AITA-INTELLIGENT Subsystem 5 (Queue & Git Analytics API)',
  });
});

// Register Subsystem 5 Core Routes (Thành viên 1 & 2)
app.use('/api/grading', gradingRoutes);
app.use('/api/dlq', gradingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/system/settings', settingsRoutes);
app.use('/api/git', gitRoutes);
app.use('/api', gradingRoutes); // Also mount /api/submissions
app.use('/api', assignmentRoutes); // Mount /api/ai/generate-assignment & /api/assignments
app.use('/api', classRoutes); // Mount /api/classes (GET & POST)

// Register Supporting Routes (Auth JWT & Excel Bulk Import with SQL Transaction)
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

// Serve Single Unified Frontend (apps/web/dist) on Cloud / Render
const potentialDistPaths = [
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../../../apps/web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), 'dist'),
];

const webDist = potentialDistPaths.find(p => fs.existsSync(p));

if (webDist) {
  console.log(`[API Server] Serving Unified Frontend from: ${webDist}`);
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`[API Server] Running at http://localhost:${port}`);
  console.log(`[API Server] Telemetry & BullMQ endpoints mounted at /api/grading`);
});
