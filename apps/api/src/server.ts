import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import gradingRoutes from './routes/gradingRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 4000;

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
app.use('/api', gradingRoutes); // Also mount /api/submissions

// Register Supporting Routes (Auth JWT & Excel Bulk Import with SQL Transaction)
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

app.listen(port, () => {
  console.log(`[API Server] Running at http://localhost:${port}`);
  console.log(`[API Server] Telemetry & BullMQ endpoints mounted at /api/grading`);
});
