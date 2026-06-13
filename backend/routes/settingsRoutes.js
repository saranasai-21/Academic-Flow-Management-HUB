import express from 'express';
import { getSettings, runDiagnostics, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();
router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/diagnostics', runDiagnostics);

export default router;
