import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { createRecord, listRecords, stats, predictPeak, trainModel } from '../controllers/energyController.js';

const router = Router();

router.use(verifyAuth);
router.post('/', createRecord);
router.get('/', listRecords);
router.get('/stats', stats);
router.get('/predict', predictPeak);
router.post('/train', trainModel);

export default router;
