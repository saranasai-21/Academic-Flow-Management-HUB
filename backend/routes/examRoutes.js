import express from 'express';
import {
  getExams,
  createExam,
  deleteExam,
  submitExamMarks
} from '../controllers/examController.js';

const router = express.Router();

router.get('/', getExams);
router.post('/', createExam);
router.delete('/:id', deleteExam);
router.post('/marks', submitExamMarks);

export default router;
