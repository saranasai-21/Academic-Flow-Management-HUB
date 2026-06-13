import express from 'express';
import { createLeaveRequest, getStudentPortal, recordFeePayment } from '../controllers/studentPortalController.js';

const router = express.Router();

router.get('/', getStudentPortal);
router.post('/:studentId/leaves', createLeaveRequest);
router.post('/:studentId/payments', recordFeePayment);

export default router;
