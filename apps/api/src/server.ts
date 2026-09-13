import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    subsystem: 'AITA-INTELLIGENT Subsystem 5 (Queue & Git Analytics API)',
  });
});

app.listen(port, () => {
  console.log(`[API Server] Running at http://localhost:${port}`);
});
