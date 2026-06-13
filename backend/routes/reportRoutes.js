import express from 'express';
import { getReportsData } from '../controllers/reportController.js';

const router = express.Router();

router.get('/', getReportsData);

export default router;
