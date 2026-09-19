import { Router } from 'express';
import { bulkImportStudents, getStudents } from '../controllers/studentController';

const router = Router();

router.get('/', getStudents);
router.post('/bulk-import', bulkImportStudents);

export default router;
