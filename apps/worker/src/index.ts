import dotenv from 'dotenv';
import { GradingWorkerService } from './grading/gradingWorker';

dotenv.config();

console.log('================================================================');
console.log('🚀 AITA-INTELLIGENT: Subsystem 5 Background Worker Starting...');
console.log('================================================================');

// Start BullMQ Worker Daemon
GradingWorkerService.start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker Daemon] Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker Daemon] Interrupted, shutting down...');
  process.exit(0);
});
