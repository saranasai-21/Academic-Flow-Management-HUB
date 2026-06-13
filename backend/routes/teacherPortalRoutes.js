import express from 'express';
import { getTeacherPortal } from '../controllers/teacherPortalController.js';

const router = express.Router();
router.get('/', getTeacherPortal);

export default router;
