import { Router } from 'express';
import { analyzeGitRepo, getGitReport } from '../controllers/gitController';

const router = Router();

// Git Repo Analysis
router.post('/analyze', analyzeGitRepo);
router.get('/report', getGitReport);

export default router;
