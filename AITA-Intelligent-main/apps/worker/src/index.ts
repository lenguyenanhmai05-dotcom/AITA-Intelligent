import dotenv from 'dotenv';
import { DEFAULT_WORKER_CONCURRENCY } from '@aita/shared';

dotenv.config();

console.log('[Worker Daemon] Initializing AITA Subsystem 5 Worker...');
console.log(`[Worker Daemon] Default Concurrency set to: ${DEFAULT_WORKER_CONCURRENCY}`);
