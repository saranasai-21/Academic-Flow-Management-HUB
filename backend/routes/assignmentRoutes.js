import express from 'express';
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  updateAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

router.get('/', getAssignments);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.post('/:id/submit', submitAssignment);

export default router;
