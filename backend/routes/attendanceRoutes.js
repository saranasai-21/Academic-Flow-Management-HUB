import express from 'express';
import {
  getStudentsForAttendance,
  getAttendanceSheet,
  submitAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/students', getStudentsForAttendance);
router.get('/', getAttendanceSheet);
router.post('/', submitAttendance);

export default router;
