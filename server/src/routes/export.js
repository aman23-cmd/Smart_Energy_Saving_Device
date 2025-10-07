import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { exportCsv, exportPdf, sendEmailReport } from '../controllers/exportController.js';

const router = Router();
router.use(verifyAuth);

router.get('/csv', exportCsv);
router.get('/pdf', exportPdf);
router.post('/email', sendEmailReport);

export default router;
